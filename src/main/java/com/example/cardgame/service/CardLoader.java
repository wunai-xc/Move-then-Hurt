package com.example.cardgame.service;

import com.example.cardgame.model.Card;
import com.example.cardgame.model.Direction;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.util.*;

@Component
public class CardLoader {
    private List<Card> allNormalCards = new ArrayList<>();  // 不含 King 的普通卡牌列表
    private Card kingCard;

    @PostConstruct
    public void init() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream is = new ClassPathResource("cards.json").getInputStream();
            List<Map<String, Object>> rawCards = mapper.readValue(is, new TypeReference<>() {});
            System.out.println("成功加载 cards.json，共 " + rawCards.size() + " 条记录");

            for (Map<String, Object> raw : rawCards) {
                String name = (String) raw.get("name");
                int hp = (int) raw.get("hp");
                int dmg = (int) raw.get("damage");
                Set<Direction> move = parseDirections((List<String>) raw.get("move"));
                Set<Direction> attack = parseDirections((List<String>) raw.get("attack"));
                Card card = new Card(name, hp, dmg, move, attack);
                if (name.equals("King")) {
                    kingCard = card;
                    System.out.println("国王卡牌加载成功: " + name);
                } else {
                    allNormalCards.add(card);
                    System.out.println("普通卡牌加载成功: " + name);
                }
            }

            if (kingCard == null) {
                throw new IllegalStateException("cards.json 中未找到名为 'King' 的卡牌！");
            }

            System.out.println("共加载普通卡牌 " + allNormalCards.size() + " 张");
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("加载 cards.json 失败", e);
        }
    }

    private Set<Direction> parseDirections(List<String> dirs) {
        if (dirs == null) return EnumSet.noneOf(Direction.class);
        Set<Direction> set = EnumSet.noneOf(Direction.class);
        for (String d : dirs) {
            try {
                set.add(Direction.valueOf(d));
            } catch (IllegalArgumentException e) {
                System.err.println("无效的方向名称: " + d);
            }
        }
        return set;
    }

    // 获取所有普通卡牌（抽卡池用，不含 King）
    public List<Card> getAllNormalCards() {
        return allNormalCards;
    }

    // 获取国王卡牌
    public Card getKingCard() {
        return kingCard;
    }
}