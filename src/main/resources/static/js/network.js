import { state } from './state.js';
import { checkDamageFloats, renderBoard, renderHand, updateTurnIndicator, showToast } from './ui.js';

export function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/game`;
    state.socket = new WebSocket(wsUrl);

    state.socket.onopen = () => console.log("WebSocket connected");
    state.socket.onerror = (err) => {
        console.error(err);
        showToast("WebSocket 连接失败，请确保后端已启动");
    };

    state.socket.onmessage = (event) => {
        const newState = JSON.parse(event.data);
        if (state.previousState) {
            checkDamageFloats(state.previousState, newState);
        }
        state.boardState = newState;
        state.currentPlayer = state.boardState.currentTurn;

        renderBoard();
        renderHand();
        updateTurnIndicator();

        if (state.boardState.gameOver) {
            showToast(`游戏结束！${state.boardState.winner === "RED" ? "红方" : "蓝方"} 胜利！`);
        }
        state.previousState = JSON.parse(JSON.stringify(newState));
    };
}