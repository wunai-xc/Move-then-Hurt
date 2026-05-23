import { dirOffset } from './constants.js';
import { state } from './state.js';

export function calculateMoveAttackPositions(unit, row, col) {
    const movePositions = [];
    const attackPositions = [];

    for (const dir of unit.card.moveDirections) {
        const [dx, dy] = dirOffset[dir];
        const nr = row + dx;
        const nc = col + dy;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && !state.boardState.board[nr][nc]) {
            movePositions.push([nr, nc]);
        }
    }

    for (const dir of unit.card.attackDirections) {
        const [dx, dy] = dirOffset[dir];
        const nr = row + dx;
        const nc = col + dy;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
            const target = state.boardState.board[nr][nc];
            if (target && target.owner !== unit.owner) {
                attackPositions.push([nr, nc]);
            }
        }
    }

    return { movePositions, attackPositions };
}