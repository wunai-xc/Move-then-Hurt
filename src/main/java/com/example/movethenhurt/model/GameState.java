package com.example.movethenhurt.model;

import java.util.*;

public class GameState {
    private Unit[][] board = new Unit[5][5];
    private Player currentTurn = Player.RED;
    private boolean gameOver = false;
    private Player winner = null;
    private Map<Player, List<Card>> hands;
    private Map<Player, Queue<Card>> decks;
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
        decks = new HashMap<>();
        hands.put(Player.RED, new ArrayList<>());
        hands.put(Player.BLUE, new ArrayList<>());
        decks.put(Player.RED, new LinkedList<>());
        decks.put(Player.BLUE, new LinkedList<>());
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
    public Map<Player, Queue<Card>> getDecks() { return decks; }
    public Queue<Card> getDeck(Player player) { return decks.get(player); }
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

    // 抽卡：从牌堆顶部抽一张到手牌，手牌满则返回 false
    public boolean drawCardToHand(Player player) {
        List<Card> hand = hands.get(player);
        if (hand.size() >= 5) return false;
        Queue<Card> deck = decks.get(player);
        if (deck.isEmpty()) return false;
        Card card = deck.poll();
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

    // 死亡处理：从棋盘移除单位，重置血量，放回对应玩家的牌堆底部
    public void returnToDeck(Unit unit) {
        Player owner = unit.getOwner();
        Card originalCard = unit.getCard();
        // 创建新卡牌实例（保留原始属性，血量重置）
        Card revived = new Card(originalCard.getId(), originalCard.getName(), originalCard.getHp(),
                originalCard.getDamage(), originalCard.getMoveDirections(), originalCard.getAttackDirections(),
                1, originalCard.isKing(), originalCard.getImageFile());
        decks.get(owner).offer(revived);
    }
}