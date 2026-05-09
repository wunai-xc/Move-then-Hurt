package com.example.cardgame.model;

import java.util.*;

public class GameState {
    private Unit[][] board = new Unit[5][5];
    private Player currentTurn = Player.PLAYER_A;
    private boolean gameOver = false;
    private Player winner = null;
    private Map<Player, List<Card>> cardPool; // 可抽取的卡牌池

    // 国王位置
    private Map<Player, int[]> kingPos = new HashMap<>();

    // 初始化棋盘、放置国王
    public void init(CardLoader loader) {
        // 加载所有卡牌到pool
        cardPool = new HashMap<>();
        cardPool.put(Player.PLAYER_A, new ArrayList<>(loader.getAllCards()));
        cardPool.put(Player.PLAYER_B, new ArrayList<>(loader.getAllCards()));
        // 放置国王: A在第4行中间(4,2), B在第0行中间(0,2)
        Card kingCard = loader.getKingCard();
        Unit kingA = new Unit(kingCard, Player.PLAYER_A, true);
        Unit kingB = new Unit(kingCard, Player.PLAYER_B, true);
        board[4][2] = kingA; kingPos.put(Player.PLAYER_A, new int[]{4,2});
        board[0][2] = kingB; kingPos.put(Player.PLAYER_B, new int[]{0,2});
    }

    // 获取某格单位
    public Unit getUnit(int x, int y) { return board[x][y]; }
    public void setUnit(int x, int y, Unit unit) { board[x][y] = unit; }
    // ... 其他getter/setter
}