package com.example.cardgame.service;

import com.example.cardgame.model.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class GameService {
    private GameState state;
    private CardLoader loader;
    private Random random = new Random();

    public GameService() throws Exception {
        loader = new CardLoader();
        resetGame();
    }

    public void resetGame() {
        state = new GameState();
        state.init(loader);
        // 双方起始抽3张卡并部署
        for (int i = 0; i < 3; i++) {
            drawAndDeploy(Player.PLAYER_A, false);
            drawAndDeploy(Player.PLAYER_B, false);
        }
    }

    // 抽卡并部署至己方半场空格，skipCheck为false
    private void drawAndDeploy(Player player, boolean skipCheck) {
        List<Card> pool = state.getCardPool().get(player);
        if (pool.isEmpty()) return;
        Card card = pool.remove(random.nextInt(pool.size()));
        // 寻找合法部署位置 (己方半场: A行3-4, B行0-1)
        List<int[]> emptySpots = new ArrayList<>();
        for (int row : (player == Player.PLAYER_A ? new int[]{3,4} : new int[]{0,1})) {
            for (int col = 0; col < 5; col++) {
                if (state.getUnit(row, col) == null) emptySpots.add(new int[]{row, col});
            }
        }
        if (!emptySpots.isEmpty()) {
            int[] pos = emptySpots.get(random.nextInt(emptySpots.size()));
            state.setUnit(pos[0], pos[1], new Unit(card, player, false));
        }
    }

    // 移动逻辑：返回是否成功
    public boolean moveUnit(Player player, int fromX, int fromY, int toX, int toY) {
        if (state.isGameOver() || state.getCurrentTurn() != player) return false;
        Unit unit = state.getUnit(fromX, fromY);
        if (unit == null || unit.getOwner() != player) return false;
        // 检查移动方向合法性
        int dx = toX - fromX, dy = toY - fromY;
        Direction dir = getDirection(dx, dy);
        if (dir == null || !unit.getCard().getMoveDirections().contains(dir)) return false;
        if (toX<0 || toX>4 || toY<0 || toY>4 || state.getUnit(toX, toY) != null) return false;
        // 执行移动
        state.setUnit(toX, toY, unit);
        state.setUnit(fromX, fromY, null);
        if (unit.isKing()) state.getKingPos().put(player, new int[]{toX, toY});
        // 自动攻击
        performAttack(unit, toX, toY);
        // 检查胜利
        checkVictory();
        if (!state.isGameOver()) state.setCurrentTurn(player == Player.PLAYER_A ? Player.PLAYER_B : Player.PLAYER_A);
        return true;
    }

    private Direction getDirection(int dx, int dy) {
        for (Direction d : Direction.values()) if (d.dx == dx && d.dy == dy) return d;
        return null;
    }

    private void performAttack(Unit attacker, int x, int y) {
        for (Direction dir : attacker.getCard().getAttackDirections()) {
            int nx = x + dir.dx, ny = y + dir.dy;
            if (nx>=0 && nx<5 && ny>=0 && ny<5) {
                Unit target = state.getUnit(nx, ny);
                if (target != null && target.getOwner() != attacker.getOwner()) {
                    target.setCurrentHp(target.getCurrentHp() - attacker.getCard().getDamage());
                    if (target.getCurrentHp() <= 0) {
                        state.setUnit(nx, ny, null);
                        if (target.isKing()) state.setGameOver(true);
                    }
                }
            }
        }
    }

    private void checkVictory() {
        // 国王死亡判负
        for (Player p : Player.values()) {
            int[] pos = state.getKingPos().get(p);
            if (pos == null || state.getUnit(pos[0], pos[1]) == null) {
                state.setGameOver(true);
                state.setWinner(p == Player.PLAYER_A ? Player.PLAYER_B : Player.PLAYER_A);
                return;
            }
        }
        // 检查国王能否移动（被围）
        for (Player p : Player.values()) {
            int[] pos = state.getKingPos().get(p);
            boolean canMove = false;
            for (Direction dir : Direction.values()) {
                int nx = pos[0] + dir.dx, ny = pos[1] + dir.dy;
                if (nx>=0 && nx<5 && ny>=0 && ny<5 && state.getUnit(nx, ny) == null) {
                    canMove = true; break;
                }
            }
            if (!canMove) {
                state.setGameOver(true);
                state.setWinner(p == Player.PLAYER_A ? Player.PLAYER_B : Player.PLAYER_A);
                return;
            }
        }
    }

    public boolean drawCard(Player player) {
        if (state.isGameOver() || state.getCurrentTurn() != player) return false;
        drawAndDeploy(player, false);
        checkVictory();
        if (!state.isGameOver()) state.setCurrentTurn(player == Player.PLAYER_A ? Player.PLAYER_B : Player.PLAYER_A);
        return true;
    }

    public GameState getState() { return state; }
}