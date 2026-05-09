package com.example.cardgame.model;

public class Unit {
    private Card card;
    private Player owner;
    private int currentHp;
    private boolean isKing;

    public Unit(Card card, Player owner, boolean isKing) {
        this.card = card; this.owner = owner; this.isKing = isKing;
        this.currentHp = card.getHp();
    }
    // getter/setter...
}