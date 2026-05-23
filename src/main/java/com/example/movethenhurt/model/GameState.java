package com.example.movethenhurt.model;

import java.util.*;

public class GameState {
    private Unit[][] board = new Unit[5][5];
    private Player currentTurn = Player.RED;
    private boolean gameOver = false;
    private Player winner = null;
    private Map<Player, List<Card>> hands;
    private Queue<Card> deck; // 统一牌堆
    private Map<Player, int[]> kingPos = new HashMap<>();

    public static final Map<String, int[]> DIR_OFFSET = new HashMap<>();
    static {
        DIR_OFFSET.put("N", new int[]{-1, 0});
        DIR_OFFSET.put("NE", new int[]{-1, 1});
        DIR_OFFSET.put("E", new int[]{0, 1});
        DIR_OFFSET.put("SE", new int[]{1, 1});
        DIR_OFFSET.put("S", new int[]{1, 0});
        DIR_OFFSET.put("SW", new int[]{1, -1});
        DIR_OFFSET.put("W", new int[]{0, -1});
        DIR_OFFSET.put("NW", new int[]{-1, -1});
    }

    public GameState() {
        hands = new HashMap<>();
        deck = new LinkedList<>();
        hands.put(Player.RED, new ArrayList<>());
        hands.put(Player.BLUE, new ArrayList<>());
    }

    public Unit[][] getBoard() { return board; }
    public void setBoard(Unit[][] board) { this.board = board; }
    public Player getCurrentTurn() { return currentTurn; }
    public void setCurrentTurn(Player currentTurn) { this.currentTurn = currentTurn; }
    public boolean isGameOver() { return gameOver; }
    public void setGameOver(boolean gameOver) { this.gameOver = gameOver; }
    public Player getWinner() { return winner; }
    public void setWinner(Player winner) { this.winner = winner; }
    public Map<Player, List<Card>> getHands() { return hands; }
    public List<Card> getHand(Player player) { return hands.get(player); }
    public Queue<Card> getDeck() { return deck; }
    public Map<Player, int[]> getKingPos() { return kingPos; }
    public int[] getKingPos(Player player) { return kingPos.get(player); }
    public void setKingPos(Player player, int[] pos) { kingPos.put(player, pos); }

    public Unit getUnit(int x, int y) {
        if (x < 0 || x >= 5 || y < 0 || y >= 5) return null;
        return board[x][y];
    }
    public void setUnit(int x, int y, Unit unit) {
        if (x >= 0 && x < 5 && y >= 0 && y < 5) board[x][y] = unit;
    }

    // 抽卡：从统一牌堆顶部抽一张到手牌，手牌满则返回 false，国王牌跳过
    public boolean drawCardToHand(Player player) {
        List<Card> hand = hands.get(player);
        if (hand.size() >= 5) return false;
        if (deck.isEmpty()) return false;
        
        // 跳过所有国王牌，直到找到非国王牌或牌堆空
        Card card = null;
        while (!deck.isEmpty()) {
            Card temp = deck.poll();
            if (!temp.isKing()) {
                card = temp;
                break;
            }
            // 国王牌放回牌堆底部，不抽
            deck.offer(temp);
        }
        
        if (card == null) return false;
        hand.add(card);
        return true;
    }

    // 部署：从手牌移除指定索引的卡牌，放到棋盘指定位置
    public boolean deployFromHand(Player player, int cardIndex, int row, int col) {
        if (row < 0 || row >= 5 || col < 0 || col >= 5) return false;
        if (board[row][col] != null) return false;
        List<Card> hand = hands.get(player);
        if (cardIndex < 0 || cardIndex >= hand.size()) return false;
        // 检查部署范围（己方两排）
        if (player == Player.RED && (row != 3 && row != 4)) return false;
        if (player == Player.BLUE && (row != 0 && row != 1)) return false;
        Card card = hand.remove(cardIndex);
        board[row][col] = new Unit(card, player, card.isKing());
        return true;
    }

    // 死亡处理：从棋盘移除单位，重置血量，放回统一牌堆底部，国王牌不回牌堆
    public void returnToDeck(Unit unit) {
        if (unit.isKing()) return; // 国王牌不回牌堆
        Card originalCard = unit.getCard();
        // 创建新卡牌实例（保留原始属性，血量重置）
        Card revived = new Card(originalCard.getId(), originalCard.getName(), originalCard.getHp(),
                originalCard.getDamage(), originalCard.getMoveDirections(), originalCard.getAttackDirections(),
                1, originalCard.isKing(), originalCard.getImageFile());
        deck.offer(revived);
    }
}