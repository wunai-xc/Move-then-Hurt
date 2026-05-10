package com.example.cardgame.model;

import java.util.Set;

public class Card {
    private String name;
    private int hp;
    private int damage;
    private Set<Direction> moveDirections;
    private Set<Direction> attackDirections;

    public Card(String name, int hp, int damage, Set<Direction> move, Set<Direction> attack) {
        this.name = name;
        this.hp = hp;
        this.damage = damage;
        this.moveDirections = move;
        this.attackDirections = attack;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getHp() {
        return hp;
    }

    public void setHp(int hp) {
        this.hp = hp;
    }

    public int getDamage() {
        return damage;
    }

    public void setDamage(int damage) {
        this.damage = damage;
    }

    public Set<Direction> getMoveDirections() {
        return moveDirections;
    }

    public void setMoveDirections(Set<Direction> moveDirections) {
        this.moveDirections = moveDirections;
    }

    public Set<Direction> getAttackDirections() {
        return attackDirections;
    }

    public void setAttackDirections(Set<Direction> attackDirections) {
        this.attackDirections = attackDirections;
    }
}