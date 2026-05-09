package com.example.cardgame.model;

import com.example.cardgame.service.CardLoader;
import java.util.*;

public class GameState {
    private Unit[][] board = new Unit[5][5];
    private Player currentTurn = Player.PLAYER_A;
    private boolean gameOver = false;
    private Player winner = null;

    // 剩余可抽卡池（不含 King）
    private Map<Player, List<Card>> cardPool;
    // 手牌
    private Map<Player, List<Card>> hands;
    // 国王位置
    private Map<Player, int[]> kingPos = new HashMap<>();

    private Random random = new Random();

    // 初始化棋盘、卡池、手牌和国王
    public void init(CardLoader loader) {
        // 卡池只包含普通卡（不包含 King）
        List<Card> normalCards = loader.getAllNormalCards();
        cardPool = new HashMap<>();
        cardPool.put(Player.PLAYER_A, new ArrayList<>(normalCards));
        cardPool.put(Player.PLAYER_B, new ArrayList<>(normalCards));

        // 手牌初始为空
        hands = new HashMap<>();
        hands.put(Player.PLAYER_A, new ArrayList<>());
        hands.put(Player.PLAYER_B, new ArrayList<>());

        // 放置国王
        Card kingCard = loader.getKingCard();
        Unit kingA = new Unit(kingCard, Player.PLAYER_A, true);
        Unit kingB = new Unit(kingCard, Player.PLAYER_B, true);
        board[4][2] = kingA;
        board[0][2] = kingB;
        kingPos.put(Player.PLAYER_A, new int[]{4, 2});
        kingPos.put(Player.PLAYER_B, new int[]{0, 2});
    }

    // ========== 卡牌管理 ==========

    // 抽卡：从卡池随机抽一张加入手牌（不自动上场）
    public boolean drawCard(Player player) {
        List<Card> pool = cardPool.get(player);
        if (pool == null || pool.isEmpty()) return false;
        List<Card> hand = hands.get(player);
        // 手牌上限可配置，这里设为 6
        if (hand.size() >= 6) return false;
        int idx = random.nextInt(pool.size());
        Card card = pool.remove(idx);
        hand.add(card);
        return true;
    }

    // 部署：从手牌中移除指定索引的卡牌，放置到棋盘位置
    public boolean deployCard(Player player, int cardIndex, int row, int col) {
        // 棋盘边界及空格检查
        if (row < 0 || row >= 5 || col < 0 || col >= 5) return false;
        if (board[row][col] != null) return false;
        // 只能在己方半场部署
        if (player == Player.PLAYER_A && (row != 3 && row != 4)) return false;
        if (player == Player.PLAYER_B && (row != 0 && row != 1)) return false;

        List<Card> hand = hands.get(player);
        if (cardIndex < 0 || cardIndex >= hand.size()) return false;
        Card card = hand.remove(cardIndex);
        board[row][col] = new Unit(card, player, false);
        return true;
    }

    // ========== 棋盘操作 ==========

    public Unit getUnit(int x, int y) {
        if (x < 0 || x >= 5 || y < 0 || y >= 5) return null;
        return board[x][y];
    }

    public void setUnit(int x, int y, Unit unit) {
        if (x >= 0 && x < 5 && y >= 0 && y < 5) {
            board[x][y] = unit;
        }
    }

    public Unit[][] getBoard() {
        return board;
    }

    // ========== 回合与游戏状态 ==========

    public Player getCurrentTurn() {
        return currentTurn;
    }

    public void setCurrentTurn(Player currentTurn) {
        this.currentTurn = currentTurn;
    }

    public boolean isGameOver() {
        return gameOver;
    }

    public void setGameOver(boolean gameOver) {
        this.gameOver = gameOver;
    }

    public Player getWinner() {
        return winner;
    }

    public void setWinner(Player winner) {
        this.winner = winner;
    }

    // ========== 卡池与手牌访问 ==========

    public Map<Player, List<Card>> getCardPool() {
        return cardPool;
    }

    public List<Card> getCardPoolForPlayer(Player player) {
        return cardPool.get(player);
    }

    public Map<Player, List<Card>> getHands() {
        return hands;
    }

    public List<Card> getHand(Player player) {
        return hands.get(player);
    }

    // ========== 国王位置 ==========

    public Map<Player, int[]> getKingPos() {
        return kingPos;
    }

    public int[] getKingPos(Player player) {
        return kingPos.get(player);
    }

    public void setKingPos(Player player, int[] pos) {
        kingPos.put(player, pos);
    }
}