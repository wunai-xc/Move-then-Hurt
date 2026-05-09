// ---------- 全局变量 ----------
let socket;
let currentPlayer = "PLAYER_A";
let boardState = null;
let moveMode = true;             // 每回合自动为 true
let selectedFrom = null;
let deployMode = false;
let selectedCardIndex = null;

// 方向映射表（用于显示箭头）
const arrowIcon = {
    'N': '↑', 'NE': '↗', 'E': '→', 'SE': '↘',
    'S': '↓', 'SW': '↙', 'W': '←', 'NW': '↖'
};

// 八个方向在卡片上的定位（百分比）
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

// ---------- 辅助函数 ----------
function getDirectionMarkers(moveSet, attackSet) {
    let markersHtml = '';
    for (const [dir, pos] of Object.entries(directionPositions)) {
        const hasMove = moveSet.has(dir);
        const hasAttack = attackSet.has(dir);
        if (!hasMove && !hasAttack) continue;
        let content = '';
        if (hasMove) content += `<span class="move-arrow">${arrowIcon[dir]}</span>`;
        if (hasAttack) content += `<span class="attack-x">X</span>`;
        if (hasMove && hasAttack) content = `<span class="move-arrow">${arrowIcon[dir]}</span><span class="attack-x">X</span>`;
        markersHtml += `
            <div class="direction-marker" style="top: ${pos.top}; left: ${pos.left}; transform: ${pos.transform};">
                ${content}
            </div>
        `;
    }
    return markersHtml;
}

// ---------- 渲染棋盘 ----------
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
                // 标记有单位（用于 CSS 显示卡牌背景）
                cell.classList.add("has-unit");
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

// ---------- 渲染手牌 ----------
function renderHand() {
    const handDiv = document.getElementById("hand");
    if (!handDiv) return;
    if (!boardState) return;
    const currentHand = boardState.hands ? boardState.hands[currentPlayer] : [];
    handDiv.innerHTML = "";
    if (!currentHand || currentHand.length === 0) {
        handDiv.innerHTML = '<div style="color:#aaa; text-align:center;">无手牌</div>';
        return;
    }
    currentHand.forEach((card, idx) => {
        const cardDiv = document.createElement("div");
        cardDiv.className = "hand-card";
        cardDiv.innerHTML = `
            <div class="hand-card-name">${card.name}</div>
            <div class="hand-card-stats">
                <span class="hand-card-hp">❤️${card.hp}</span>
                <span class="hand-card-dmg">⚔️${card.damage}</span>
            </div>
        `;
        cardDiv.onclick = (e) => {
            e.stopPropagation();
            if (boardState.gameOver) return;
            if (boardState.currentTurn !== currentPlayer) return;
            // 退出移动模式
            moveMode = false;
            // 进入部署模式
            deployMode = true;
            selectedCardIndex = idx;
            document.getElementById("message").innerText = `部署模式：点击己方半场空格部署“${card.name}”`;
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
            // 检查是否在己方半场
            if (currentPlayer === "PLAYER_A" && (x !== 3 && x !== 4)) {
                document.getElementById("message").innerText = "只能在己方半场（第3-4行）部署！";
                deployMode = false;
                selectedCardIndex = null;
                return;
            }
            if (currentPlayer === "PLAYER_B" && (x !== 0 && x !== 1)) {
                document.getElementById("message").innerText = "只能在己方半场（第0-1行）部署！";
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
            document.getElementById("message").innerText = "目标格子已有单位，不能部署";
        }
        deployMode = false;
        selectedCardIndex = null;
        return;
    }

    // 移动模式
    if (!moveMode) {
        document.getElementById("message").innerText = "当前不是移动模式，请等待回合开始。";
        return;
    }
    const unit = boardState.board[x][y];
    if (selectedFrom === null) {
        if (unit && unit.owner === currentPlayer) {
            selectedFrom = [x, y];
            document.getElementById("message").innerText = `已选中 ${unit.card.name}，点击移动目标格子`;
        } else {
            document.getElementById("message").innerText = "请先点击己方单位";
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
        moveMode = false;   // 移动后回合结束，等待下回合自动激活
        document.getElementById("message").innerText = "";
    }
}

// ---------- WebSocket 连接与消息处理 ----------
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
        renderHand();

        // 每回合开始时自动进入移动模式，清除选中和部署模式
        moveMode = true;
        selectedFrom = null;
        deployMode = false;
        selectedCardIndex = null;
        const moveBtn = document.getElementById("moveModeBtn");
        if (moveBtn) moveBtn.classList.add("move-mode-active");

        if (boardState.gameOver) {
            document.getElementById("message").innerText = `游戏结束！${boardState.winner} 胜利！`;
            moveMode = false;
            if (moveBtn) moveBtn.classList.remove("move-mode-active");
        } else {
            document.getElementById("turnIndicator").innerText = `当前回合: ${currentPlayer}`;
            document.getElementById("message").innerText = "";
        }
    };
}

// ---------- 按钮事件绑定 ----------
function bindEvents() {
    const moveBtn = document.getElementById("moveModeBtn");
    const drawBtn = document.getElementById("drawBtn");
    const resetBtn = document.getElementById("resetBtn");

    if (moveBtn) {
        moveBtn.onclick = () => {
            if (boardState.gameOver) return;
            if (currentPlayer !== boardState.currentTurn) {
                document.getElementById("message").innerText = "不是你的回合";
                return;
            }
            // 手动激活移动模式（在误关闭时可用）
            moveMode = true;
            deployMode = false;
            selectedCardIndex = null;
            selectedFrom = null;
            moveBtn.classList.add("move-mode-active");
            document.getElementById("message").innerText = "已激活移动模式，点击己方单位再点击空格移动";
        };
    }

    if (drawBtn) {
        drawBtn.onclick = () => {
            if (boardState.gameOver) return;
            if (currentPlayer !== boardState.currentTurn) {
                document.getElementById("message").innerText = "不是你的回合";
                return;
            }
            socket.send(JSON.stringify({ action: "draw", player: currentPlayer }));
            moveMode = false;
            if (moveBtn) moveBtn.classList.remove("move-mode-active");
            document.getElementById("message").innerText = "抽卡中...";
        };
    }

    if (resetBtn) {
        resetBtn.onclick = () => {
            socket.send(JSON.stringify({ action: "reset" }));
        };
    }
}

// ---------- 启动 ----------
connect();
bindEvents();