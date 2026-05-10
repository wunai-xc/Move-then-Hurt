package com.example.movethenhurt.model;

import java.util.Set;

public class Card {
    private int id;
    private String name;
    private int hp;
    private int damage;
    private Set<String> moveDirections;   // 例如 ["N","E","W","S"]
    private Set<String> attackDirections;
    private int countInDeck;   // 牌堆中的初始数量
    private boolean isKing;
    private String imageFile;   // 例如 "0_国王.jpg"

    public Card(int id, String name, int hp, int damage, Set<String> moveDirections,
                Set<String> attackDirections, int countInDeck, boolean isKing, String imageFile) {
        this.id = id;
        this.name = name;
        this.hp = hp;
        this.damage = damage;
        this.moveDirections = moveDirections;
        this.attackDirections = attackDirections;
        this.countInDeck = countInDeck;
        this.isKing = isKing;
        this.imageFile = imageFile;
    }

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getHp() { return hp; }
    public void setHp(int hp) { this.hp = hp; }
    public int getDamage() { return damage; }
    public void setDamage(int damage) { this.damage = damage; }
    public Set<String> getMoveDirections() { return moveDirections; }
    public void setMoveDirections(Set<String> moveDirections) { this.moveDirections = moveDirections; }
    public Set<String> getAttackDirections() { return attackDirections; }
    public void setAttackDirections(Set<String> attackDirections) { this.attackDirections = attackDirections; }
    public int getCountInDeck() { return countInDeck; }
    public void setCountInDeck(int countInDeck) { this.countInDeck = countInDeck; }
    public boolean isKing() { return isKing; }
    public void setKing(boolean king) { isKing = king; }
    public String getImageFile() { return imageFile; }
    public void setImageFile(String imageFile) { this.imageFile = imageFile; }
}