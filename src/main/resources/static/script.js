let socket; let currentPlayer = "PLAYER_A"; let boardState;
let moveMode = false; let selectedFrom = null;

function connect() {
    socket = new WebSocket("ws://localhost:8080/game");
    socket.onmessage = (event) => {
        boardState = JSON.parse(event.data);
        currentPlayer = boardState.currentTurn;
        renderBoard();
        if (boardState.gameOver) document.getElementById("message").innerText = `游戏结束！${boardState.winner} 胜利！`;
        else document.getElementById("turnIndicator").innerText = `当前回合: ${currentPlayer}`;
    };
}

function renderBoard() {
    const boardDiv = document.getElementById("board"); boardDiv.innerHTML = "";
    for (let i=0; i<5; i++) {
        for (let j=0; j<5; j++) {
            const cell = document.createElement("div"); cell.className = "cell";
            const unit = boardState.board[i][j];
            if (unit) {
                cell.innerText = `${unit.card.name}\n❤️${unit.currentHp}\n⚔️${unit.card.damage}`;
                cell.classList.add(unit.owner.toLowerCase());
                if (unit.king) cell.classList.add("king");
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
        socket.send(JSON.stringify({action:"move", player: currentPlayer, fromX:selectedFrom[0], fromY:selectedFrom[1], toX:x, toY:y}));
        selectedFrom = null; moveMode = false;
    }
}

document.getElementById("moveModeBtn").onclick = () => { if(!boardState.gameOver && currentPlayer===boardState.currentTurn) moveMode=true; };
document.getElementById("drawBtn").onclick = () => { if(!boardState.gameOver && currentPlayer===boardState.currentTurn) socket.send(JSON.stringify({action:"draw", player: currentPlayer})); };
document.getElementById("resetBtn").onclick = () => socket.send(JSON.stringify({action:"reset"}));

connect();