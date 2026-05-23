import { arrowIcon, rotateDir180, dirPositions } from './constants.js';
import { state } from './state.js';
import { calculateMoveAttackPositions } from './logic.js';

export function showToast(msg) {
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

export function showFloatingNumber(row, col, text) {
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

export function checkDamageFloats(oldState, newState) {
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

export function clearHighlights() {
    const cells = document.querySelectorAll('.board .cell');
    cells.forEach(cell => cell.classList.remove('move-target', 'attack-target'));
    const cards = document.querySelectorAll('.board .card');
    cards.forEach(card => card.classList.remove('selected'));
}

export function updateActivePlayerArea() {
    const redArea = document.getElementById("redArea");
    const blueArea = document.getElementById("blueArea");

    if (redArea) redArea.classList.toggle('active', state.currentPlayer === "RED");
    if (blueArea) blueArea.classList.toggle('active', state.currentPlayer === "BLUE");
}

export function updateTurnIndicator() {
    const turnIndicator = document.getElementById("turnIndicator");
    if (!turnIndicator) return;

    const turnPlayer = turnIndicator.querySelector('.turn-player');
    if (turnPlayer) {
        turnPlayer.innerText = state.currentPlayer === "RED" ? "🔴 红方" : "🔵 蓝方";
    }

    const isRed = state.currentPlayer === "RED";
    turnIndicator.classList.toggle('red-turn', isRed);
    turnIndicator.classList.toggle('blue-turn', !isRed);
    document.body.classList.toggle('turn-red', isRed);
    document.body.classList.toggle('turn-blue', !isRed);
}

export function renderBoard() {
    // 确保 boardState 和 board 矩阵都存在
    if (!state.boardState || !state.boardState.board) {
        console.warn("板局数据未就绪，跳过本次棋盘渲染");
        return;
    }

    const boardDiv = document.getElementById("board");
    if (!boardDiv) return;
    boardDiv.innerHTML = "";

    // 游戏结束时添加金色闪烁效果
    document.body.classList.toggle('game-over', !!state.boardState.gameOver);

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.setAttribute('data-row', i);
            cell.setAttribute('data-col', j);

            if (i === 0 || i === 1) cell.classList.add("blue-area");
            else if (i === 3 || i === 4) cell.classList.add("red-area");
            else cell.classList.add("middle-line");
            const unit = state.boardState.board[i][j];
            const prevUnit = state.previousState?.board?.[i]?.[j];

            if (unit) {
                cell.classList.add("has-unit");
                const isBlue = unit.owner === 'BLUE';
                const isNewUnit = !prevUnit;
                const hpPercent = unit.currentHp / unit.card.hp;

                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';
                if (isBlue) cardDiv.classList.add('card-blue');
                if (isNewUnit) cardDiv.classList.add('card-new');

                const bgDarkness = Math.floor((1 - hpPercent) * 60);
                cardDiv.style.backgroundColor = `rgb(${255 - bgDarkness}, ${255 - bgDarkness}, ${240 - bgDarkness})`;

                const img = document.createElement('img');
                img.src = `Cards/${unit.card.imageFile}`;
                img.className = 'card-img';
                img.style.filter = `brightness(${0.4 + hpPercent * 0.6})`;
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

    // 恢复选中高亮状态
    if (state.selectedFrom) {
        const [sr, sc] = state.selectedFrom;
        const selectedCell = document.querySelector(`.cell[data-row='${sr}'][data-col='${sc}']`);
        if (selectedCell) {
            selectedCell.querySelector('.card')?.classList.add('selected');
            const unit = state.boardState.board[sr][sc];
            if (unit) {
                const { movePositions, attackPositions } = calculateMoveAttackPositions(unit, sr, sc);
                movePositions.forEach(([r, c]) => document.querySelector(`.cell[data-row='${r}'][data-col='${c}']`)?.classList.add('move-target'));
                attackPositions.forEach(([r, c]) => document.querySelector(`.cell[data-row='${r}'][data-col='${c}']`)?.classList.add('attack-target'));
            }
        }
    }
}

export function renderHand() {
    // 确保手牌数据安全
    if (!state.boardState || !state.boardState.hands) {
        console.warn("手牌数据未就绪，跳过本次手牌渲染");
        return;
    }

    const redHandDiv = document.getElementById("redHand");
    const blueHandDiv = document.getElementById("blueHand");
    if (!redHandDiv || !blueHandDiv) return;

    redHandDiv.innerHTML = "";
    blueHandDiv.innerHTML = "";

    const redHand = state.boardState.hands["RED"] || [];
    const blueHand = state.boardState.hands["BLUE"] || [];

    if (redHand.length === 0) redHandDiv.innerHTML = '<div style="color:#aaa; padding:10px;">无手牌</div>';
    else redHand.forEach((card, idx) => redHandDiv.appendChild(createHandCard(card, "RED", idx)));

    if (blueHand.length === 0) blueHandDiv.innerHTML = '<div style="color:#aaa; padding:10px;">无手牌</div>';
    else blueHand.forEach((card, idx) => blueHandDiv.appendChild(createHandCard(card, "BLUE", idx)));

    const deckSize = state.boardState.deck?.length || 0;
    const redDeckCount = document.getElementById("redDeckCount");
    const blueDeckCount = document.getElementById("blueDeckCount");
    if (redDeckCount) redDeckCount.innerText = deckSize;
    if (blueDeckCount) blueDeckCount.innerText = deckSize;

    updateActivePlayerArea();
}

function createHandCard(card, player, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'hand-card';
    cardDiv.classList.add(player === state.currentPlayer ? 'your-card' : 'disabled');

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

    if (player === state.currentPlayer && !state.boardState.gameOver && state.boardState.currentTurn === state.currentPlayer) {
        cardDiv.onclick = (e) => {
            e.stopPropagation();
            state.deployMode = true;
            state.selectedCardIndex = index;
            clearHighlights();
            renderHand();
            showToast(`部署模式：点击己方两排内的空格部署"${card.name}"`);
        };
    }
    return cardDiv;
}

export function handleCellClick(x, y) {
    if (state.boardState.gameOver) return;

    if (state.deployMode && state.selectedCardIndex !== null) {
        const unit = state.boardState.board[x][y];
        if (unit === null) {
            if (state.currentPlayer === "RED" && (x !== 3 && x !== 4)) {
                showToast("只能在己方两排（第3-4行）部署！");
                state.deployMode = false;
                state.selectedCardIndex = null;
                renderHand();
                return;
            }
            if (state.currentPlayer === "BLUE" && (x !== 0 && x !== 1)) {
                showToast("只能在己方两排（第0-1行）部署！");
                state.deployMode = false;
                state.selectedCardIndex = null;
                renderHand();
                return;
            }
            state.socket.send(JSON.stringify({
                action: "deploy",
                player: state.currentPlayer,
                cardIndex: state.selectedCardIndex,
                row: x,
                col: y
            }));
        } else {
            showToast("目标格子已有单位");
        }
        state.deployMode = false;
        state.selectedCardIndex = null;
        renderHand();
        return;
    } else {
        const unit = state.boardState.board[x][y];

        if (state.selectedFrom) {
            const selectedUnit = state.boardState.board[state.selectedFrom[0]][state.selectedFrom[1]];
            if (selectedUnit) {
                const { movePositions } = calculateMoveAttackPositions(selectedUnit, state.selectedFrom[0], state.selectedFrom[1]);
                const isMoveTarget = movePositions.some(([r, c]) => r === x && c === y);
                if (isMoveTarget) {
                    state.socket.send(JSON.stringify({
                        action: "move",
                        player: state.currentPlayer,
                        fromX: state.selectedFrom[0],
                        fromY: state.selectedFrom[1],
                        toX: x,
                        toY: y
                    }));
                    state.selectedFrom = null;
                    clearHighlights();
                    return;
                }
            }
        }

        clearHighlights();
        state.selectedFrom = null;

        if (unit && unit.owner === state.currentPlayer) {
            state.selectedFrom = [x, y];
            renderBoard();
            renderHand();
            showToast(`已选中 ${unit.card.name}，点击绿色边框格子移动`);
        } else {
            showToast("请先点击己方单位");
        }
    }
}