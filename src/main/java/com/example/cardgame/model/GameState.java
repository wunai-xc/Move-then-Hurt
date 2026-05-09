package com.example.cardgame.model;

import com.example.cardgame.service.CardLoader;
import java.util.*;

public class GameState {
    private Unit[][] board = new Unit[5][5];
    private Player currentTurn = Player.PLAYER_A;
    private boolean gameOver = false;
    private Player winner = null;
    private Map<Player, List<Card>> cardPool; // 可抽取的卡牌池
    private Map<Player, int[]> kingPos = new HashMap<>();

    // 初始化棋盘、放置国王
    public void init(CardLoader loader) {
        // 加载所有卡牌到pool（深拷贝，避免引用污染）
        List<Card> allCards = loader.getAllCards();
        cardPool = new HashMap<>();
        cardPool.put(Player.PLAYER_A, new ArrayList<>(allCards));
        cardPool.put(Player.PLAYER_B, new ArrayList<>(allCards));

        // 放置国王: A在第4行中间(4,2), B在第0行中间(0,2)
        Card kingCard = loader.getKingCard();
        Unit kingA = new Unit(kingCard, Player.PLAYER_A, true);
        Unit kingB = new Unit(kingCard, Player.PLAYER_B, true);
        board[4][2] = kingA;
        board[0][2] = kingB;
        kingPos.put(Player.PLAYER_A, new int[]{4, 2});
        kingPos.put(Player.PLAYER_B, new int[]{0, 2});
    }

    // 获取/设置棋盘上的单位
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

    // 获取/设置当前回合玩家
    public Player getCurrentTurn() {
        return currentTurn;
    }

    public void setCurrentTurn(Player currentTurn) {
        this.currentTurn = currentTurn;
    }

    // 游戏结束状态及胜者
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

    // 卡池管理
    public Map<Player, List<Card>> getCardPool() {
        return cardPool;
    }

    public List<Card> getCardPoolForPlayer(Player player) {
        return cardPool.get(player);
    }

    // 国王位置管理
    public Map<Player, int[]> getKingPos() {
        return kingPos;
    }

    public int[] getKingPos(Player player) {
        return kingPos.get(player);
    }

    public void setKingPos(Player player, int[] pos) {
        kingPos.put(player, pos);
    }

    // 辅助方法：深拷贝整个游戏状态（用于回滚或日志，可选）
    public GameState deepCopy() {
        GameState copy = new GameState();
        // 复制棋盘
        for (int i = 0; i < 5; i++) {
            for (int j = 0; j < 5; j++) {
                if (board[i][j] != null) {
                    copy.board[i][j] = board[i][j].deepCopy();
                }
            }
        }
        copy.currentTurn = this.currentTurn;
        copy.gameOver = this.gameOver;
        copy.winner = this.winner;
        // 复制卡池
        copy.cardPool = new HashMap<>();
        for (Player p : Player.values()) {
            copy.cardPool.put(p, new ArrayList<>(this.cardPool.get(p)));
        }
        // 复制国王位置
        for (Player p : Player.values()) {
            int[] pos = this.kingPos.get(p);
            if (pos != null) copy.kingPos.put(p, new int[]{pos[0], pos[1]});
        }
        return copy;
    }
}