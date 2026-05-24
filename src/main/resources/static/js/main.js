import { state } from './state.js';
import { connect } from './network.js';
import { clearHighlights, renderHand, showToast, updatePlayerBadge, togglePlayer } from './ui.js';

function bindEvents() {
    const drawBtn = document.getElementById("drawBtn");
    const resetBtn = document.getElementById("resetBtn");
    const exitBtn = document.getElementById("exitBtn");
    const playerToggle = document.getElementById("playerToggle");

    if (drawBtn) {
        drawBtn.onclick = () => {
            if (state.boardState.gameOver) return;
            if (state.boardState.currentTurn !== state.currentPlayer) {
                showToast("不是你的回合");
                return;
            }
            clearHighlights();
            state.selectedFrom = null;
            state.deployMode = false;
            state.selectedCardIndex = null;
            state.socket.send(JSON.stringify({ action: "draw", player: state.currentPlayer }));
        };
    }

    if (resetBtn) {
        resetBtn.onclick = () => {
            clearHighlights();
            state.selectedFrom = null;
            state.deployMode = false;
            state.selectedCardIndex = null;
            state.socket.send(JSON.stringify({ action: "reset" }));
        };
    }

    if (exitBtn) {
        exitBtn.onclick = () => {
            window.location.href = "/";
        };
    }

    if (playerToggle) {
        playerToggle.addEventListener("click", () => {
            togglePlayer();
        });
    }
}

function init() {
    updatePlayerBadge();
}

// 启动游戏
connect();
bindEvents();
init();