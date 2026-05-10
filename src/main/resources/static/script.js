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

let previousState = null; // 用于检测受伤飘字

function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/game`;
    socket = new WebSocket(wsUrl);
    socket.onopen = () => console.log("WebSocket connected");
    socket.onerror = (err) => console.error(err);
    socket.onmessage = (event) => {
        const newState = JSON.parse(event.data);
        if (previousState) checkDamageFloats(previousState, newState);
        boardState = newState;
        currentPlayer = boardState.currentTurn;
        renderBoard();
        renderHand();
        document.getElementById("turnIndicator").innerText = `当前回合: ${currentPlayer === "RED" ? "红方" : "蓝方"}`;
        if (boardState.gameOver) {
            showModal(`游戏结束！${boardState.winner === "RED" ? "红方" : "蓝方"} 胜利！`);
        }
        previousState = JSON.parse(JSON.stringify(newState));
    };
}

// 检查血量变化，产生飘字
function checkDamageFloats(oldState, newState) {
    for (let i=0;i<5;i++) {
        for (let j=0;j<5;j++) {
            const oldUnit = oldState.board[i][j];
            const newUnit = newState.board[i][j];
            if (oldUnit && newUnit && oldUnit.card.id === newUnit.card.id && oldUnit.currentHp > newUnit.currentHp) {
                const dmg = oldUnit.currentHp - newUnit.currentHp;
                showFloatingNumber(i, j, `-${dmg}`);
            }
        }
    }
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

function renderBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";
    for (let i=0;i<5;i++) {
        for (let j=0;j<5;j++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.setAttribute('data-row', i);
            cell.setAttribute('data-col', j);
            const unit = boardState.board[i][j];
            if (unit) {
                cell.classList.add("has-unit");
                const img = document.createElement('img');
                img.src = `Cards/${unit.card.imageFile}`;
                img.className = 'card-img';
                // 根据血量百分比调整亮度（血量越低越暗）
                const hpPercent = unit.currentHp / unit.card.hp;
                const brightness = 0.5 + hpPercent * 0.5;
                img.style.filter = `brightness(${brightness})`;
                cell.appendChild(img);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'card-info';
                infoDiv.innerHTML = `
                    <div class="card-name">${unit.card.name}</div>
                    <div class="card-hp-dmg">
                        <span class="card-hp">❤️${unit.currentHp}</span>
                        <span class="card-dmg">⚔️${unit.card.damage}</span>
                    </div>
                `;
                cell.appendChild(infoDiv);

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
                    marker.style.top = pos.top;
                    marker.style.left = pos.left;
                    marker.style.transform = pos.transform;
                    if (hasMove) marker.innerHTML += `<span class="move-arrow">${arrowIcon[dir]}</span>`;
                    if (hasAttack) marker.innerHTML += `<span class="attack-x">X</span>`;
                    dirContainer.appendChild(marker);
                }
                cell.appendChild(dirContainer);
            } else {
                cell.innerText = "⬚";
            }
            cell.onclick = () => handleCellClick(i,j);
            boardDiv.appendChild(cell);
        }
    }
}

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
        cardDiv.innerHTML = `
            <img src="Cards/${card.imageFile}" style="width:42px;height:112px;object-fit:cover;">
            <div class="card-info" style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,240,0.8);">
                <div class="card-name">${card.name}</div>
                <div class="card-hp-dmg">
                    <span class="card-hp">❤️${card.hp}</span>
                    <span class="card-dmg">⚔️${card.damage}</span>
                </div>
            </div>
        `;
        cardDiv.style.position = 'relative';
        cardDiv.onclick = (e) => {
            e.stopPropagation();
            if (boardState.gameOver) return;
            if (boardState.currentTurn !== currentPlayer) return;
            deployMode = true;
            selectedCardIndex = idx;
            showModal(`部署模式：点击己方两排内的空格部署“${card.name}”`);
        };
        handDiv.appendChild(cardDiv);
    });
}

function handleCellClick(x,y) {
    if (boardState.gameOver) return;
    // 部署模式
    if (deployMode && selectedCardIndex !== null) {
        const unit = boardState.board[x][y];
        if (unit === null) {
            // 检查是否在己方两排内
            if (currentPlayer === "RED" && (x !== 3 && x !== 4)) {
                showModal("只能在己方两排（第3-4行）部署！");
                deployMode = false;
                selectedCardIndex = null;
                return;
            }
            if (currentPlayer === "BLUE" && (x !== 0 && x !== 1)) {
                showModal("只能在己方两排（第0-1行）部署！");
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
            showModal("目标格子已有单位");
        }
        deployMode = false;
        selectedCardIndex = null;
        return;
    }

    // 移动模式
    const unit = boardState.board[x][y];
    if (selectedFrom === null) {
        if (unit && unit.owner === currentPlayer) {
            selectedFrom = [x,y];
            showModal(`已选中 ${unit.card.name}，点击移动目标格子`);
        } else {
            showModal("请先点击己方单位");
        }
    } else {
        socket.send(JSON.stringify({
            action: "move",
            player: currentPlayer,
            fromX: selectedFrom[0],
            fromY: selectedFrom[1],
            toX: x,
            toY: y
        }));
        selectedFrom = null;
    }
}

function showModal(msg) {
    // 简单实现，可以根据需要美化
    alert(msg);
}

document.getElementById("drawBtn").onclick = () => {
    if (boardState.gameOver) return;
    if (boardState.currentTurn !== currentPlayer) {
        showModal("不是你的回合");
        return;
    }
    socket.send(JSON.stringify({ action: "draw", player: currentPlayer }));
};
document.getElementById("resetBtn").onclick = () => socket.send(JSON.stringify({ action: "reset" }));
document.getElementById("exitBtn").onclick = () => window.location.href = "/";

connect();