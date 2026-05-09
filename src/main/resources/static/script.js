let socket;
let currentPlayer = "PLAYER_A";
let boardState;
let moveMode = false;
let selectedFrom = null;

// 方向映射表（用于显示箭头）
const arrowIcon = {
    'N': '↑', 'NE': '↗', 'E': '→', 'SE': '↘',
    'S': '↓', 'SW': '↙', 'W': '←', 'NW': '↖'
};

// 八个方向及其在卡片上的定位（绝对位置百分比）
const directionPositions = {
    'N':  { top: '0%', left: '50%', transform: 'translate(-50%, -50%)' },
    'NE': { top: '0%', left: '100%', transform: 'translate(-50%, -50%)' },
    'E':  { top: '50%', left: '100%', transform: 'translate(-50%, -50%)' },
    'SE': { top: '100%', left: '100%', transform: 'translate(-50%, -50%)' },
    'S':  { top: '100%', left: '50%', transform: 'translate(-50%, -50%)' },
    'SW': { top: '100%', left: '0%', transform: 'translate(-50%, -50%)' },
    'W':  { top: '50%', left: '0%', transform: 'translate(-50%, -50%)' },
    'NW': { top: '0%', left: '0%', transform: 'translate(-50%, -50%)' }
};

// 生成方向标记 HTML（箭头和 X 直接印在边缘）
function getDirectionMarkers(moveSet, attackSet) {
    let markersHtml = '';
    for (const [dir, pos] of Object.entries(directionPositions)) {
        const hasMove = moveSet.has(dir);
        const hasAttack = attackSet.has(dir);
        if (!hasMove && !hasAttack) continue;
        // 构建内部内容：移动箭头 + 攻击 X（可同时存在，用空格或并排）
        let content = '';
        if (hasMove) content += `<span class="move-arrow">${arrowIcon[dir]}</span>`;
        if (hasAttack) content += `<span class="attack-x">X</span>`;
        // 如果两者都有，用换行或空格分开（在狭小空间内上下排列）
        if (hasMove && hasAttack) content = `<span class="move-arrow">${arrowIcon[dir]}</span><span class="attack-x">X</span>`;
        markersHtml += `
            <div class="direction-marker" style="top: ${pos.top}; left: ${pos.left}; transform: ${pos.transform};">
                ${content}
            </div>
        `;
    }
    return markersHtml;
}

function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/game`;
    console.log("Connecting to WebSocket:", wsUrl);
    socket = new WebSocket(wsUrl);
    socket.onopen = () => console.log("WebSocket connected");
    socket.onerror = (err) => console.error("WebSocket error", err);
    socket.onmessage = (event) => {
        boardState = JSON.parse(event.data);
        currentPlayer = boardState.currentTurn;
        renderBoard();
        if (boardState.gameOver) {
            document.getElementById("message").innerText = `游戏结束！${boardState.winner} 胜利！`;
        } else {
            document.getElementById("turnIndicator").innerText = `当前回合: ${currentPlayer}`;
        }
    };
}

function renderBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";
    if (!boardState || !boardState.board) {
        console.error("No boardState yet");
        return;
    }
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            const unit = boardState.board[i][j];
            if (unit) {
                const moveSet = new Set(unit.card.moveDirections);
                const attackSet = new Set(unit.card.attackDirections);
                const markersHtml = getDirectionMarkers(moveSet, attackSet);
                cell.innerHTML = `
                    <div class="card-header">
                        <div class="card-hp">血:${unit.currentHp}</div>
                        <div class="card-name">${unit.card.name}</div>
                        <div class="card-dmg">攻:${unit.card.damage}</div>
                    </div>
                    <div class="direction-markers-container">
                        ${markersHtml}
                    </div>
                `;
                cell.classList.add(unit.owner.toLowerCase());
                if (unit.king) cell.classList.add("king");
            } else {
                cell.innerText = "⬚";
            }
            cell.onclick = () => handleCellClick(i, j);
            boardDiv.appendChild(cell);
        }
    }
}

function handleCellClick(x, y) {
    if (boardState.gameOver) return;
    if (!moveMode) return;
    const unit = boardState.board[x][y];
    if (selectedFrom === null) {
        if (unit && unit.owner === currentPlayer) selectedFrom = [x, y];
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
        moveMode = false;
    }
}

document.getElementById("moveModeBtn").onclick = () => {
    if (!boardState.gameOver && currentPlayer === boardState.currentTurn) moveMode = true;
};
document.getElementById("drawBtn").onclick = () => {
    if (!boardState.gameOver && currentPlayer === boardState.currentTurn) {
        socket.send(JSON.stringify({ action: "draw", player: currentPlayer }));
    }
};
document.getElementById("resetBtn").onclick = () => {
    socket.send(JSON.stringify({ action: "reset" }));
};

connect();