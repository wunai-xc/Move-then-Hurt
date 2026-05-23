package com.example.movethenhurt.service;

import com.example.movethenhurt.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GameService {
    private GameState state;
    private final CardLoader cardLoader;

    @Autowired
    public GameService(CardLoader cardLoader) {
        this.cardLoader = cardLoader;
        resetGame();
    }

    public void resetGame() {
        state = new GameState();
        // 初始化牌堆（根据模板数量生成多份，国王牌不加入牌堆）
        for (Player p : Player.values()) {
            Queue<Card> deck = state.getDeck(p);
            for (Card template : cardLoader.getCardTemplates()) {
                if (template.isKing()) continue; // 跳过国王牌，不加入牌堆
                for (int i = 0; i < template.getCountInDeck(); i++) {
                    Card copy = new Card(template.getId(), template.getName(), template.getHp(),
                            template.getDamage(), template.getMoveDirections(), template.getAttackDirections(),
                            1, template.isKing(), template.getImageFile());
                    deck.offer(copy);
                }
            }
            // 洗牌（可选）
            List<Card> list = new ArrayList<>(deck);
            Collections.shuffle(list);
            deck.clear();
            deck.addAll(list);
        }

        // 放置国王
        Card kingTemplate = cardLoader.getCardTemplates().stream().filter(Card::isKing).findFirst().orElse(null);
        if (kingTemplate == null) throw new RuntimeException("未找到国王卡牌");
        Unit redKing = new Unit(kingTemplate, Player.RED, true);
        Unit blueKing = new Unit(kingTemplate, Player.BLUE, true);
        state.setUnit(4, 2, redKing);
        state.setUnit(0, 2, blueKing);
        state.getKingPos().put(Player.RED, new int[]{4, 2});
        state.getKingPos().put(Player.BLUE, new int[]{0, 2});

        // 各抽3张起始手牌
        for (int i = 0; i < 3; i++) {
            drawCard(Player.RED);
            drawCard(Player.BLUE);
        }
        state.setCurrentTurn(Player.RED);
    }

    public void drawCard(Player player) {
        if (state.isGameOver() || state.getCurrentTurn() != player) return;
        boolean success = state.drawCardToHand(player);
        if (success) {
            checkVictory();
            if (!state.isGameOver()) switchTurn();
        } else {
            // 手牌满，前端应弹出提示
        }
    }

    public void deployUnit(Player player, int cardIndex, int row, int col) {
        if (state.isGameOver() || state.getCurrentTurn() != player) return;
        boolean success = state.deployFromHand(player, cardIndex, row, col);
        if (success) {
            checkVictory();
            if (!state.isGameOver()) switchTurn();
        }
    }

    public void moveUnit(Player player, int fromX, int fromY, int toX, int toY) {
        if (state.isGameOver() || state.getCurrentTurn() != player) return;
        Unit unit = state.getUnit(fromX, fromY);
        if (unit == null || unit.getOwner() != player) return;
        int dx = toX - fromX, dy = toY - fromY;
        String dir = getDirection(dx, dy);
        if (dir == null || !unit.getCard().getMoveDirections().contains(dir)) return;
        if (toX < 0 || toX > 4 || toY < 0 || toY > 4) return;
        if (state.getUnit(toX, toY) != null) return;

        // 移动
        state.setUnit(toX, toY, unit);
        state.setUnit(fromX, fromY, null);
        if (unit.isKing()) state.getKingPos().put(player, new int[]{toX, toY});

        // 攻击
        performAttack(unit, toX, toY);

        // 检查胜利
        checkVictory();
        if (!state.isGameOver()) switchTurn();
    }

    private void performAttack(Unit attacker, int x, int y) {
        for (String dir : attacker.getCard().getAttackDirections()) {
            int[] offset = GameState.DIR_OFFSET.get(dir);
            int nx = x + offset[0], ny = y + offset[1];
            if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
                Unit target = state.getUnit(nx, ny);
                if (target != null && target.getOwner() != attacker.getOwner()) {
                    target.setCurrentHp(target.getCurrentHp() - attacker.getCard().getDamage());
                    if (target.getCurrentHp() <= 0) {
                        state.setUnit(nx, ny, null);
                        state.returnToDeck(target);
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
        // 国王死亡
        for (Player p : Player.values()) {
            int[] pos = state.getKingPos().get(p);
            if (pos == null || state.getUnit(pos[0], pos[1]) == null) {
                state.setGameOver(true);
                state.setWinner(p == Player.RED ? Player.BLUE : Player.RED);
                return;
            }
        }
        // 国王被围
        for (Player p : Player.values()) {
            int[] pos = state.getKingPos().get(p);
            boolean canMove = false;
            for (String dir : GameState.DIR_OFFSET.keySet()) {
                int[] off = GameState.DIR_OFFSET.get(dir);
                int nx = pos[0] + off[0], ny = pos[1] + off[1];
                if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5 && state.getUnit(nx, ny) == null) {
                    canMove = true;
                    break;
                }
            }
            if (!canMove) {
                state.setGameOver(true);
                state.setWinner(p == Player.RED ? Player.BLUE : Player.RED);
                return;
            }
        }
    }

    private String getDirection(int dx, int dy) {
        for (Map.Entry<String, int[]> entry : GameState.DIR_OFFSET.entrySet()) {
            int[] off = entry.getValue();
            if (off[0] == dx && off[1] == dy) return entry.getKey();
        }
        return null;
    }

    private void switchTurn() {
        state.setCurrentTurn(state.getCurrentTurn() == Player.RED ? Player.BLUE : Player.RED);
    }

    public GameState getState() { return state; }
}