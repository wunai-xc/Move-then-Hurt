// ---------- 全局变量 ----------
let socket;
let currentPlayer = "RED";
let boardState = null;
let selectedFrom = null;   // 移动模式选中的单位坐标
let deployMode = false;
let selectedCardIndex = null;

// 方向箭头映射
const arrowIcon = {
    'N': '↑', 'NE': '↗', 'E': '→', 'SE': '↘',
    'S': '↓', 'SW': '↙', 'W': '←', 'NW': '↖'
};

// 方向旋转180度的映射
const rotateDir180 = {
    'N': 'S', 'NE': 'SW', 'E': 'W', 'SE': 'NW',
    'S': 'N', 'SW': 'NE', 'W': 'E', 'NW': 'SE'
};

// 八个方向在卡片上的绝对定位（百分比）
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

// 方向偏移量（用于计算可移动/攻击位置）
const dirOffset = {
    'N':  [-1, 0], 'NE': [-1, 1], 'E':  [0, 1], 'SE': [1, 1],
    'S':  [1, 0], 'SW': [1, -1], 'W':  [0, -1], 'NW': [-1, -1]
};

let previousState = null; // 用于检测受伤飘字

// ---------- 浮窗提示（替代 alert）----------
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

// ---------- 受伤飘字 ----------
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
                // 添加上抖动动画
                const cell = document.querySelector(`.board .cell[data-row='${i}'][data-col='${j}']`);
                if (cell) {
                    cell.classList.add('shake');
                    setTimeout(() => cell.classList.remove('shake'), 400);
                }
            }
        }
    }
}

// ---------- 计算可移动和可攻击位置 ----------
function calculateMoveAttackPositions(unit, row, col) {
    const movePositions = [];
    const attackPositions = [];
    
    // 计算可移动位置
    for (const dir of unit.card.moveDirections) {
        const [dx, dy] = dirOffset[dir];
        const nr = row + dx;
        const nc = col + dy;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && !boardState.board[nr][nc]) {
            movePositions.push([nr, nc]);
        }
    }
    
    // 计算可攻击位置（从选中位置攻击
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

// ---------- 清除高亮 ----------
function clearHighlights() {
    const cells = document.querySelectorAll('.board .cell');
    cells.forEach(cell => {
        cell.classList.remove('move-target', 'attack-target');
    });
    // 清除所有卡牌的选中效果
    const cards = document.querySelectorAll('.board .card');
    cards.forEach(card => {
        card.classList.remove('selected');
    });
}

// ---------- 渲染棋盘 ----------
function renderBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.setAttribute('data-row', i);
            cell.setAttribute('data-col', j);
            
            // 添加区域颜色类
            if (i === 0 || i === 1) {
                cell.classList.add("blue-area");
            } else if (i === 3 || i === 4) {
                cell.classList.add("red-area");
            } else {
                cell.classList.add("middle-line");
            }
            
            const unit = boardState.board[i][j];
            
            if (unit) {
                cell.classList.add("has-unit");
                
                const isBlue = unit.owner === 'BLUE';
                
                // 创建卡牌容器
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';
                if (isBlue) {
                    cardDiv.classList.add('card-blue');
                }
                
                // 卡牌图片
                const img = document.createElement('img');
                img.src = `Cards/${unit.card.imageFile}`;
                img.className = 'card-img';
                // 根据血量百分比调整亮度（血量越低越暗）
                const hpPercent = unit.currentHp / unit.card.hp;
                const brightness = 0.4 + hpPercent * 0.6;
                img.style.filter = `brightness(${brightness})`;
                cardDiv.appendChild(img);

                // 文字层
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

                // 方向标记
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
                    
                    // 对于蓝方卡牌，旋转方向180度
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
    
    // 重新应用高亮
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

// ---------- 渲染手牌 ----------
function renderHand() {
    const handDiv = document.getElementById("hand");
    if (!handDiv) return;
    const hand = boardState.hands[currentPlayer] || [];
    handDiv.innerHTML = "";
    if (hand.length === 0) {
        handDiv.innerHTML = '<div style="color:#aaa;">无手牌</div>';
        return;
    }
    hand.forEach((card, idx) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'hand-card';
        
        // 图片
        const img = document.createElement('img');
        img.src = `Cards/${card.imageFile}`;
        cardDiv.appendChild(img);
        
        // 信息层
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
        
        // 方向标记
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
        
        cardDiv.style.position = 'relative';
        cardDiv.onclick = (e) => {
            e.stopPropagation();
            if (boardState.gameOver) return;
            if (boardState.currentTurn !== currentPlayer) return;
            deployMode = true;
            selectedCardIndex = idx;
            clearHighlights();
            showToast(`部署模式：点击己方两排内的空格部署“${card.name}”`);
        };
        handDiv.appendChild(cardDiv);
    });
}

// ---------- 处理点击格子（移动 / 部署）----------
function handleCellClick(x, y) {
    if (boardState.gameOver) return;
    
    // 部署模式
    if (deployMode && selectedCardIndex !== null) {
        const unit = boardState.board[x][y];
        if (unit === null) {
            if (currentPlayer === "RED" && (x !== 3 && x !== 4)) {
                showToast("只能在己方两排（第3-4行）部署！");
                deployMode = false;
                selectedCardIndex = null;
                return;
            }
            if (currentPlayer === "BLUE" && (x !== 0 && x !== 1)) {
                showToast("只能在己方两排（第0-1行）部署！");
                deployMode = false;
                selectedCardIndex = null;
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
        return;
    } else {
        // 移动模式
        const unit = boardState.board[x][y];
        
        // 检查是否点击的是可移动目标
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
        
        // 不是移动目标，重置选择
        clearHighlights();
        selectedFrom = null;
        
        if (unit && unit.owner === currentPlayer) {
            selectedFrom = [x, y];
            renderBoard(); // 重新渲染以显示高亮
            showToast(`已选中 ${unit.card.name}，点击绿色边框格子移动`);
        } else {
            showToast("请先点击己方单位");
        }
    }
}

// ---------- WebSocket 连接与消息处理 ----------
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
        document.getElementById("turnIndicator").innerText = `当前回合: ${currentPlayer === "RED" ? "红方" : "蓝方"}`;
        if (boardState.gameOver) {
            showToast(`游戏结束！${boardState.winner === "RED" ? "红方" : "蓝方"} 胜利！`);
        }
        previousState = JSON.parse(JSON.stringify(newState));
    };
}

// ---------- 按钮事件绑定 ----------
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
            socket.send(JSON.stringify({ action: "draw", player: currentPlayer }));
        };
    }
    if (resetBtn) {
        resetBtn.onclick = () => {
            clearHighlights();
            selectedFrom = null;
            socket.send(JSON.stringify({ action: "reset" }));
        };
    }
    if (exitBtn) {
        exitBtn.onclick = () => {
            window.location.href = "/";
        };
    }
}

// ---------- 启动 ----------
connect();
bindEvents();
