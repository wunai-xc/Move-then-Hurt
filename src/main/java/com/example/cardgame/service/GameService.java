package com.example.cardgame.service;

import com.example.cardgame.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GameService {
    private GameState state;
    private final CardLoader loader;
    private final Random random = new Random();

    @Autowired
    public GameService(CardLoader loader) {
        this.loader = loader;
        resetGame();
    }

    public void resetGame() {
        System.out.println("========== 重置游戏 ==========");
        state = new GameState();
        state.init(loader);
        for (int i = 0; i < 3; i++) {
            drawCard(Player.PLAYER_A);
            drawCard(Player.PLAYER_B);
        }
        System.out.println("resetGame 完成，当前棋盘状态：");
        printBoard();
    }

    public boolean drawCard(Player player) {
        if (state.isGameOver() || state.getCurrentTurn() != player) return false;
        boolean success = state.drawCard(player);
        if (success) {
            checkVictory();
            if (!state.isGameOver()) {
                state.setCurrentTurn(player == Player.PLAYER_A ? Player.PLAYER_B : Player.PLAYER_A);
            }
        }
        return success;
    }

    public boolean deployUnit(Player player, int cardIndex, int row, int col) {
        if (state.isGameOver() || state.getCurrentTurn() != player) return false;
        boolean success = state.deployCard(player, cardIndex, row, col);
        if (success) {
            checkVictory();
            if (!state.isGameOver()) {
                state.setCurrentTurn(player == Player.PLAYER_A ? Player.PLAYER_B : Player.PLAYER_A);
            }
        }
        return success;
    }

    // 修正后的移动逻辑，确保方向判断正确
    public boolean moveUnit(Player player, int fromX, int fromY, int toX, int toY) {
        if (state.isGameOver() || state.getCurrentTurn() != player) return false;
        Unit unit = state.getUnit(fromX, fromY);
        if (unit == null || unit.getOwner() != player) return false;
        int dx = toX - fromX, dy = toY - fromY;
        Direction dir = getDirection(dx, dy);
        if (dir == null) {
            System.out.println("移动方向无效: dx=" + dx + ", dy=" + dy);
            return false;
        }

        // 【关键】获取卡牌允许的移动方向集合
        Set<Direction> allowedMoveDirs = unit.getCard().getMoveDirections();
        System.out.println("单位 " + unit.getCard().getName() + " 允许的移动方向: " + allowedMoveDirs);
        System.out.println("尝试移动方向: " + dir);

        if (!allowedMoveDirs.contains(dir)) {
            System.out.println("移动方向不允许！");
            return false;
        }

        if (toX < 0 || toX > 4 || toY < 0 || toY > 4) return false;
        if (state.getUnit(toX, toY) != null) return false;

        // 执行移动
        state.setUnit(toX, toY, unit);
        state.setUnit(fromX, fromY, null);
        if (unit.isKing()) {
            state.getKingPos().put(player, new int[]{toX, toY});
        }

        // 自动攻击
        performAttack(unit, toX, toY);

        // 检查胜利
        checkVictory();

        if (!state.isGameOver()) {
            state.setCurrentTurn(player == Player.PLAYER_A ? Player.PLAYER_B : Player.PLAYER_A);
        }
        return true;
    }

    private Direction getDirection(int dx, int dy) {
        for (Direction d : Direction.values()) {
            if (d.dx == dx && d.dy == dy) return d;
        }
        return null;
    }

    private void performAttack(Unit attacker, int x, int y) {
        for (Direction dir : attacker.getCard().getAttackDirections()) {
            int nx = x + dir.dx;
            int ny = y + dir.dy;
            if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
                Unit target = state.getUnit(nx, ny);
                if (target != null && target.getOwner() != attacker.getOwner()) {
                    target.setCurrentHp(target.getCurrentHp() - attacker.getCard().getDamage());
                    System.out.println(attacker.getCard().getName() + " 攻击 " + target.getCard().getName() +
                            " 造成 " + attacker.getCard().getDamage() + " 伤害，剩余血量 " + target.getCurrentHp());
                    if (target.getCurrentHp() <= 0) {
                        state.setUnit(nx, ny, null);
                        System.out.println(target.getCard().getName() + " 被消灭");
                        if (target.isKing()) {
                            state.setGameOver(true);
                            state.setWinner(attacker.getOwner());
                        }
                    }
                }
            }
        }
    }

    private void checkVictory() {
        for (Player p : Player.values()) {
            int[] pos = state.getKingPos().get(p);
            if (pos == null || state.getUnit(pos[0], pos[1]) == null) {
                state.setGameOver(true);
                state.setWinner(p == Player.PLAYER_A ? Player.PLAYER_B : Player.PLAYER_A);
                System.out.println("游戏结束，胜者：" + state.getWinner());
                return;
            }
        }
        for (Player p : Player.values()) {
            int[] pos = state.getKingPos().get(p);
            boolean canMove = false;
            for (Direction dir : Direction.values()) {
                int nx = pos[0] + dir.dx;
                int ny = pos[1] + dir.dy;
                if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5 && state.getUnit(nx, ny) == null) {
                    canMove = true;
                    break;
                }
            }
            if (!canMove) {
                state.setGameOver(true);
                state.setWinner(p == Player.PLAYER_A ? Player.PLAYER_B : Player.PLAYER_A);
                System.out.println("国王被围，游戏结束，胜者：" + state.getWinner());
                return;
            }
        }
    }

    private void printBoard() {
        for (int i = 0; i < 5; i++) {
            StringBuilder row = new StringBuilder();
            for (int j = 0; j < 5; j++) {
                Unit u = state.getUnit(i, j);
                if (u == null) row.append(" . ");
                else row.append(u.getCard().getName().substring(0, 1)).append(u.getOwner() == Player.PLAYER_A ? "A" : "B").append(" ");
            }
            System.out.println(row);
        }
    }

    public GameState getState() {
        return state;
    }
}