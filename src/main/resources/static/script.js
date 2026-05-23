let socket;
let currentPlayer = "RED";
let boardState = null;
let selectedFrom = null;
let deployMode = false;
let selectedCardIndex = null;

const arrowIcon = {
    'N': '↑', 'NE': '↗', 'E': '→', 'SE': '↘',
    'S': '↓', 'SW': '↙', 'W': '←', 'NW': '↖'
};

const rotateDir180 = {
    'N': 'S', 'NE': 'SW', 'E': 'W', 'SE': 'NW',
    'S': 'N', 'SW': 'NE', 'W': 'E', 'NW': 'SE'
};

const dirPositions = {
    'N':  { top: '0%', left: '50%', transform: 'translate(-50%, -50%)' },
    'NE': { top: '0%', left: '100%', transform: 'translate(-50%, -50%)' },
    'E':  { top: '50%', left: '100%', transform: 'translate(-50%, -50%)' },
    'SE': { top: '100%', left: '100%', transform: 'translate(-50%, -50%)' },
    'S':  { top: '100%', left: '50%', transform: 'translate(-50%, -50%)' },
    'SW': { top: '100%', left: '0%', transform: 'translate(-50%, -50%)' },
    'W':  { top: '50%', left: '0%', transform: 'translate(-50%, -50%)' },
    'NW': { top: '0%', left: '0%', transform: 'translate(-50%, -50%)' }
};

const dirOffset = {
    'N':  [-1, 0], 'NE': [-1, 1], 'E':  [0, 1], 'SE': [1, 1],
    'S':  [1, 0], 'SW': [1, -1], 'W':  [0, -1], 'NW': [-1, -1]
};

let previousState = null;

function showToast(msg) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerText = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2000);
}

function showFloatingNumber(row, col, text) {
    const cell = document.querySelector(`.board .cell[data-row='${row}'][data-col='${col}']`);
    if (!cell) return;
    const div = document.createElement('div');
    div.className = 'float-number';
    div.innerText = text;
    div.style.position = 'absolute';
    div.style.left = '50%';
    div.style.top = '30%';
    div.style.transform = 'translate(-50%, 0)';
    cell.style.position = 'relative';
    cell.appendChild(div);
    setTimeout(() => div.remove(), 1000);
}

function checkDamageFloats(oldState, newState) {
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const oldUnit = oldState?.board?.[i]?.[j];
            const newUnit = newState?.board?.[i]?.[j];
            if (oldUnit && newUnit && oldUnit.card.id === newUnit.card.id && oldUnit.currentHp > newUnit.currentHp) {
                const dmg = oldUnit.currentHp - newUnit.currentHp;
                showFloatingNumber(i, j, `-${dmg}`);
                const cell = document.querySelector(`.board .cell[data-row='${i}'][data-col='${j}']`);
                if (cell) {
                    cell.classList.add('shake');
                    setTimeout(() => cell.classList.remove('shake'), 400);
                }
            }
        }
    }
}

function calculateMoveAttackPositions(unit, row, col) {
    const movePositions = [];
    const attackPositions = [];
    
    for (const dir of unit.card.moveDirections) {
        const [dx, dy] = dirOffset[dir];
        const nr = row + dx;
        const nc = col + dy;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && !boardState.board[nr][nc]) {
            movePositions.push([nr, nc]);
        }
    }
    
    for (const dir of unit.card.attackDirections) {
        const [dx, dy] = dirOffset[dir];
        const nr = row + dx;
        const nc = col + dy;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
            const target = boardState.board[nr][nc];
            if (target && target.owner !== unit.owner) {
                attackPositions.push([nr, nc]);
            }
        }
    }
    
    return { movePositions, attackPositions };
}

function clearHighlights() {
    const cells = document.querySelectorAll('.board .cell');
    cells.forEach(cell => {
        cell.classList.remove('move-target', 'attack-target');
    });
    const cards = document.querySelectorAll('.board .card');
    cards.forEach(card => {
        card.classList.remove('selected');
    });
}

function renderBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.setAttribute('data-row', i);
            cell.setAttribute('data-col', j);
            
            if (i === 0 || i === 1) {
                cell.classList.add("blue-area");
            } else if (i === 3 || i === 4) {
                cell.classList.add("red-area");
            } else {
                cell.classList.add("middle-line");
            }
            
            const unit = boardState.board[i][j];
            const prevUnit = previousState?.board?.[i]?.[j];
            
            if (unit) {
                cell.classList.add("has-unit");
                
                const isBlue = unit.owner === 'BLUE';
                const isNewUnit = !prevUnit;
                
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';
                if (isBlue) {
                    cardDiv.classList.add('card-blue');
                }
                if (isNewUnit) {
                    cardDiv.classList.add('card-new');
                }
                
                const img = document.createElement('img');
                img.src = `Cards/${unit.card.imageFile}`;
                img.className = 'card-img';
                const hpPercent = unit.currentHp / unit.card.hp;
                const brightness = 0.4 + hpPercent * 0.6;
                img.style.filter = `brightness(${brightness})`;
                cardDiv.appendChild(img);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'card-info';
                infoDiv.innerHTML = `
                    <div class="card-name">${unit.card.name}</div>
                    <div class="card-hp-dmg">
                        <span class="card-hp">❤️${unit.currentHp}</span>
                        <span class="card-dmg">⚔️${unit.card.damage}</span>
                    </div>
                `;
                cardDiv.appendChild(infoDiv);

                const dirContainer = document.createElement('div');
                dirContainer.className = 'direction-markers';
                const moveSet = new Set(unit.card.moveDirections);
                const attackSet = new Set(unit.card.attackDirections);
                for (const [dir, pos] of Object.entries(dirPositions)) {
                    const hasMove = moveSet.has(dir);
                    const hasAttack = attackSet.has(dir);
                    if (!hasMove && !hasAttack) continue;
                    const marker = document.createElement('div');
                    marker.className = 'direction-marker';
                    
                    const actualDir = isBlue ? rotateDir180[dir] : dir;
                    const actualPos = dirPositions[actualDir];
                    marker.style.top = actualPos.top;
                    marker.style.left = actualPos.left;
                    marker.style.transform = actualPos.transform;
                    if (hasMove) marker.innerHTML += `<span class="move-arrow">${arrowIcon[actualDir]}</span>`;
                    if (hasAttack) marker.innerHTML += `<span class="attack-x">X</span>`;
                    dirContainer.appendChild(marker);
                }
                cardDiv.appendChild(dirContainer);
                cell.appendChild(cardDiv);
            }
            cell.onclick = () => handleCellClick(i, j);
            boardDiv.appendChild(cell);
        }
    }
    
    if (selectedFrom) {
        const selectedCell = document.querySelector(`.cell[data-row='${selectedFrom[0]}'][data-col='${selectedFrom[1]}']`);
        if (selectedCell) {
            const cardDiv = selectedCell.querySelector('.card');
            if (cardDiv) {
                cardDiv.classList.add('selected');
            }
            const unit = boardState.board[selectedFrom[0]][selectedFrom[1]];
            if (unit) {
                const { movePositions, attackPositions } = calculateMoveAttackPositions(unit, selectedFrom[0], selectedFrom[1]);
                movePositions.forEach(([r, c]) => {
                    const cell = document.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
                    if (cell) cell.classList.add('move-target');
                });
                attackPositions.forEach(([r, c]) => {
                    const cell = document.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
                    if (cell) cell.classList.add('attack-target');
                });
            }
        }
    }
}

function renderHand() {
    const redHandDiv = document.getElementById("redHand");
    const blueHandDiv = document.getElementById("blueHand");
    
    if (!redHandDiv || !blueHandDiv) return;
    
    redHandDiv.innerHTML = "";
    blueHandDiv.innerHTML = "";
    
    const redHand = boardState.hands["RED"] || [];
    const blueHand = boardState.hands["BLUE"] || [];
    
    if (redHand.length === 0) {
        redHandDiv.innerHTML = '<div style="color:#aaa; padding:10px;">无手牌</div>';
    } else {
        redHand.forEach((card, idx) => {
            const cardDiv = createHandCard(card, "RED", idx);
            redHandDiv.appendChild(cardDiv);
        });
    }
    
    if (blueHand.length === 0) {
        blueHandDiv.innerHTML = '<div style="color:#aaa; padding:10px;">无手牌</div>';
    } else {
        blueHand.forEach((card, idx) => {
            const cardDiv = createHandCard(card, "BLUE", idx);
            blueHandDiv.appendChild(cardDiv);
        });
    }
    
    const redDeckCount = document.getElementById("redDeckCount");
    const blueDeckCount = document.getElementById("blueDeckCount");
    const deckSize = boardState.deck?.length || 0;
    if (redDeckCount) redDeckCount.innerText = deckSize;
    if (blueDeckCount) blueDeckCount.innerText = deckSize;
    
    updateActivePlayerArea();
}

function createHandCard(card, player, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'hand-card';
    
    if (player === currentPlayer) {
        cardDiv.classList.add('your-card');
    } else {
        cardDiv.classList.add('disabled');
    }
    
    const img = document.createElement('img');
    img.src = `Cards/${card.imageFile}`;
    cardDiv.appendChild(img);
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'card-info';
    infoDiv.innerHTML = `
        <div class="card-name">${card.name}</div>
        <div class="card-hp-dmg">
            <span class="card-hp">❤️${card.hp}</span>
            <span class="card-dmg">⚔️${card.damage}</span>
        </div>
    `;
    cardDiv.appendChild(infoDiv);
    
    const dirContainer = document.createElement('div');
    dirContainer.className = 'direction-markers';
    const moveSet = new Set(card.moveDirections);
    const attackSet = new Set(card.attackDirections);
    for (const [dir, pos] of Object.entries(dirPositions)) {
        const hasMove = moveSet.has(dir);
        const hasAttack = attackSet.has(dir);
        if (!hasMove && !hasAttack) continue;
        const marker = document.createElement('div');
        marker.className = 'direction-marker';
        marker.style.top = pos.top;
        marker.style.left = pos.left;
        marker.style.transform = pos.transform;
        if (hasMove) marker.innerHTML += `<span class="move-arrow">${arrowIcon[dir]}</span>`;
        if (hasAttack) marker.innerHTML += `<span class="attack-x">X</span>`;
        dirContainer.appendChild(marker);
    }
    cardDiv.appendChild(dirContainer);
    
    if (player === currentPlayer && !boardState.gameOver && boardState.currentTurn === currentPlayer) {
        cardDiv.onclick = (e) => {
            e.stopPropagation();
            deployMode = true;
            selectedCardIndex = index;
            clearHighlights();
            renderHand();
            showToast(`部署模式：点击己方两排内的空格部署"${card.name}"`);
        };
    }
    
    return cardDiv;
}

function updateActivePlayerArea() {
    const redArea = document.getElementById("redArea");
    const blueArea = document.getElementById("blueArea");
    
    if (redArea) {
        if (currentPlayer === "RED") {
            redArea.classList.add('active');
        } else {
            redArea.classList.remove('active');
        }
    }
    
    if (blueArea) {
        if (currentPlayer === "BLUE") {
            blueArea.classList.add('active');
        } else {
            blueArea.classList.remove('active');
        }
    }
}

function updateTurnIndicator() {
    const turnIndicator = document.getElementById("turnIndicator");
    if (!turnIndicator) return;
    
    const turnPlayer = turnIndicator.querySelector('.turn-player');
    if (turnPlayer) {
        turnPlayer.innerText = currentPlayer === "RED" ? "🔴 红方" : "🔵 蓝方";
    }
    
    if (currentPlayer === "RED") {
        turnIndicator.classList.add('red-turn');
        turnIndicator.classList.remove('blue-turn');
        document.body.classList.add('turn-red');
        document.body.classList.remove('turn-blue');
    } else {
        turnIndicator.classList.add('blue-turn');
        turnIndicator.classList.remove('red-turn');
        document.body.classList.add('turn-blue');
        document.body.classList.remove('turn-red');
    }
}

function handleCellClick(x, y) {
    if (boardState.gameOver) return;
    
    if (deployMode && selectedCardIndex !== null) {
        const unit = boardState.board[x][y];
        if (unit === null) {
            if (currentPlayer === "RED" && (x !== 3 && x !== 4)) {
                showToast("只能在己方两排（第3-4行）部署！");
                deployMode = false;
                selectedCardIndex = null;
                renderHand();
                return;
            }
            if (currentPlayer === "BLUE" && (x !== 0 && x !== 1)) {
                showToast("只能在己方两排（第0-1行）部署！");
                deployMode = false;
                selectedCardIndex = null;
                renderHand();
                return;
            }
            socket.send(JSON.stringify({
                action: "deploy",
                player: currentPlayer,
                cardIndex: selectedCardIndex,
                row: x,
                col: y
            }));
        } else {
            showToast("目标格子已有单位");
        }
        deployMode = false;
        selectedCardIndex = null;
        renderHand();
        return;
    } else {
        const unit = boardState.board[x][y];
        
        if (selectedFrom) {
            const selectedUnit = boardState.board[selectedFrom[0]][selectedFrom[1]];
            if (selectedUnit) {
                const { movePositions } = calculateMoveAttackPositions(selectedUnit, selectedFrom[0], selectedFrom[1]);
                const isMoveTarget = movePositions.some(([r, c]) => r === x && c === y);
                if (isMoveTarget) {
                    socket.send(JSON.stringify({
                        action: "move",
                        player: currentPlayer,
                        fromX: selectedFrom[0],
                        fromY: selectedFrom[1],
                        toX: x,
                        toY: y
                    }));
                    selectedFrom = null;
                    clearHighlights();
                    return;
                }
            }
        }
        
        clearHighlights();
        selectedFrom = null;
        
        if (unit && unit.owner === currentPlayer) {
            selectedFrom = [x, y];
            renderBoard();
            renderHand();
            showToast(`已选中 ${unit.card.name}，点击绿色边框格子移动`);
        } else {
            showToast("请先点击己方单位");
        }
    }
}

function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/game`;
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => console.log("WebSocket connected");
    socket.onerror = (err) => {
        console.error(err);
        showToast("WebSocket 连接失败，请确保后端已启动");
    };
    
    socket.onmessage = (event) => {
        const newState = JSON.parse(event.data);
        if (previousState) checkDamageFloats(previousState, newState);
        boardState = newState;
        currentPlayer = boardState.currentTurn;
        renderBoard();
        renderHand();
        updateTurnIndicator();
        if (boardState.gameOver) {
            showToast(`游戏结束！${boardState.winner === "RED" ? "红方" : "蓝方"} 胜利！`);
        }
        previousState = JSON.parse(JSON.stringify(newState));
    };
}

function bindEvents() {
    const drawBtn = document.getElementById("drawBtn");
    const resetBtn = document.getElementById("resetBtn");
    const exitBtn = document.getElementById("exitBtn");

    if (drawBtn) {
        drawBtn.onclick = () => {
            if (boardState.gameOver) return;
            if (boardState.currentTurn !== currentPlayer) {
                showToast("不是你的回合");
                return;
            }
            clearHighlights();
            selectedFrom = null;
            deployMode = false;
            selectedCardIndex = null;
            socket.send(JSON.stringify({ action: "draw", player: currentPlayer }));
        };
    }
    
    if (resetBtn) {
        resetBtn.onclick = () => {
            clearHighlights();
            selectedFrom = null;
            deployMode = false;
            selectedCardIndex = null;
            socket.send(JSON.stringify({ action: "reset" }));
        };
    }
    
    if (exitBtn) {
        exitBtn.onclick = () => {
            window.location.href = "/";
        };
    }
}

connect();
bindEvents();
