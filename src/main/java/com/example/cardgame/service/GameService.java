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
        // 双方起始抽3张卡并部署
        for (int i = 0; i < 3; i++) {
            drawAndDeploy(Player.PLAYER_A);
            drawAndDeploy(Player.PLAYER_B);
        }
        System.out.println("resetGame 完成，当前棋盘状态：");
        printBoard();
    }

    private void drawAndDeploy(Player player) {
        List<Card> pool = state.getCardPool().get(player);
        if (pool == null || pool.isEmpty()) {
            System.out.println("玩家 " + player + " 卡池已空，无法抽卡");
            return;
        }
        Card card = pool.remove(random.nextInt(pool.size()));
        System.out.println("玩家 " + player + " 抽到卡牌：" + card.getName());

        // 寻找合法部署位置 (己方半场: A行3-4, B行0-1)
        List<int[]> emptySpots = new ArrayList<>();
        int[] rows = (player == Player.PLAYER_A) ? new int[]{3, 4} : new int[]{0, 1};
        for (int row : rows) {
            for (int col = 0; col < 5; col++) {
                if (state.getUnit(row, col) == null) {
                    emptySpots.add(new int[]{row, col});
                }
            }
        }
        if (!emptySpots.isEmpty()) {
            int[] pos = emptySpots.get(random.nextInt(emptySpots.size()));
            state.setUnit(pos[0], pos[1], new Unit(card, player, false));
            System.out.println("→ 部署到 (" + pos[0] + "," + pos[1] + ")");
        } else {
            System.out.println("→ 己方半场无空格，卡牌弃掉");
        }
    }

    // 打印棋盘（便于调试）
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

    public boolean moveUnit(Player player, int fromX, int fromY, int toX, int toY) {
        if (state.isGameOver() || state.getCurrentTurn() != player) return false;
        Unit unit = state.getUnit(fromX, fromY);
        if (unit == null || unit.getOwner() != player) return false;
        int dx = toX - fromX, dy = toY - fromY;
        Direction dir = getDirection(dx, dy);
        if (dir == null || !unit.getCard().getMoveDirections().contains(dir)) return false;
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

        // 检查胜利条件
        checkVictory();

        // 切换回合（如果游戏未结束）
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
        // 国王死亡判负
        for (Player p : Player.values()) {
            int[] pos = state.getKingPos().get(p);
            if (pos == null || state.getUnit(pos[0], pos[1]) == null) {
                state.setGameOver(true);
                state.setWinner(p == Player.PLAYER_A ? Player.PLAYER_B : Player.PLAYER_A);
                System.out.println("游戏结束，胜者：" + state.getWinner());
                return;
            }
        }
        // 国王被围无法移动判负
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

    public boolean drawCard(Player player) {
        if (state.isGameOver() || state.getCurrentTurn() != player) return false;
        drawAndDeploy(player);
        checkVictory();
        if (!state.isGameOver()) {
            state.setCurrentTurn(player == Player.PLAYER_A ? Player.PLAYER_B : Player.PLAYER_A);
        }
        return true;
    }

    public GameState getState() {
        return state;
    }
}