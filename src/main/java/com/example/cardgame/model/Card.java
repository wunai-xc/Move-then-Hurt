package com.example.cardgame.model;

import java.util.Set;

public class Card {
    private String name;
    private int hp;
    private int damage;
    private Set<Direction> moveDirections;
    private Set<Direction> attackDirections;

    // 构造器、getter/setter
    public Card(String name, int hp, int damage, Set<Direction> move, Set<Direction> attack) {
        this.name = name; this.hp = hp; this.damage = damage;
        this.moveDirections = move; this.attackDirections = attack;
    }
    // 省略getter/setter (需自行补充)
}