package com.example.cardgame.model;

public class Unit {
    private Card card;
    private Player owner;
    private int currentHp;
    private boolean isKing;

    public Unit(Card card, Player owner, boolean isKing) {
        this.card = card;
        this.owner = owner;
        this.isKing = isKing;
        this.currentHp = card.getHp();
    }

    // Getter 和 Setter
    public Card getCard() {
        return card;
    }

    public void setCard(Card card) {
        this.card = card;
    }

    public Player getOwner() {
        return owner;
    }

    public void setOwner(Player owner) {
        this.owner = owner;
    }

    public int getCurrentHp() {
        return currentHp;
    }

    public void setCurrentHp(int currentHp) {
        this.currentHp = currentHp;
    }

    public boolean isKing() {
        return isKing;
    }

    public void setKing(boolean king) {
        isKing = king;
    }

    // 深拷贝（可选，供 GameState.deepCopy 使用）
    public Unit deepCopy() {
        Unit copy = new Unit(this.card, this.owner, this.isKing);
        copy.currentHp = this.currentHp;
        return copy;
    }
}