let socket;
let currentPlayer = "PLAYER_A";
let boardState;
let moveMode = false;
let selectedFrom = null;

// 方向映射：文字 → 箭头符号
const arrowIcon = {
    'N': '↑', 'NE': '↗', 'E': '→', 'SE': '↘',
    'S': '↓', 'SW': '↙', 'W': '←', 'NW': '↖'
};

// 3x3 网格中的方向顺序（索引0~8，中心为 null）
const dirGrid = [
    'N', 'NE', 'E',
    'NW', null, 'SE',
    'W', 'SW', 'S'
];

// 生成方向格子的 HTML
function getDirectionsHtml(moveSet, attackSet) {
    return dirGrid.map(dir => {
        if (dir === null) {
            return `<div class="dir-cell center"></div>`;
        }
        const hasMove = moveSet.has(dir);
        const hasAttack = attackSet.has(dir);
        const inner = hasMove ? `<span class="dir-arrow">${arrowIcon[dir]}</span>` : '';
        const outer = hasAttack ? `<span class="dir-attack">X</span>` : '';
        return `<div class="dir-cell" data-dir="${dir}">${outer}${inner}</div>`;
    }).join('');
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
                const directionsHtml = getDirectionsHtml(moveSet, attackSet);
                cell.innerHTML = `
                    <div class="card-header">
                        <div class="card-hp">血:${unit.currentHp}</div>
                        <div class="card-name">${unit.card.name}</div>
                        <div class="card-dmg">攻:${unit.card.damage}</div>
                    </div>
                    <div class="card-directions">
                        ${directionsHtml}
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