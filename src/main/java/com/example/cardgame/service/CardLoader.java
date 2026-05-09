package com.example.cardgame.service;

import com.example.cardgame.model.Card;
import com.example.cardgame.model.Direction;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import java.io.InputStream;
import java.util.*;

public class CardLoader {
    private List<Card> allCards = new ArrayList<>();
    private Card kingCard;

    public CardLoader() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        InputStream is = new ClassPathResource("cards.json").getInputStream();
        List<Map<String, Object>> rawCards = mapper.readValue(is, new TypeReference<>() {});
        for (Map<String, Object> raw : rawCards) {
            String name = (String) raw.get("name");
            int hp = (int) raw.get("hp");
            int dmg = (int) raw.get("damage");
            Set<Direction> move = parseDirections((List<String>) raw.get("move"));
            Set<Direction> attack = parseDirections((List<String>) raw.get("attack"));
            Card card = new Card(name, hp, dmg, move, attack);
            allCards.add(card);
            if (name.equals("King")) kingCard = card;
        }
    }

    private Set<Direction> parseDirections(List<String> dirs) {
        Set<Direction> set = EnumSet.noneOf(Direction.class);
        for (String d : dirs) set.add(Direction.valueOf(d));
        return set;
    }
    public List<Card> getAllCards() { return allCards; }
    public Card getKingCard() { return kingCard; }
}