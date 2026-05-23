package com.example.movethenhurt.service;

import com.example.movethenhurt.model.Card;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.util.*;

@Component
public class CardLoader {
    private List<Card> cardTemplates = new ArrayList<>();

    @PostConstruct
    public void init() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        InputStream is = new ClassPathResource("cards.json").getInputStream();
        List<Map<String, Object>> rawCards = mapper.readValue(is, new TypeReference<>() {});
        for (Map<String, Object> raw : rawCards) {
            int id = (int) raw.get("id");
            String name = (String) raw.get("name");
            int hp = (int) raw.get("hp");
            int damage = (int) raw.get("damage");
            List<String> moveList = (List<String>) raw.get("move");
            List<String> attackList = (List<String>) raw.get("attack");
            Set<String> move = new HashSet<>(moveList);
            Set<String> attack = new HashSet<>(attackList);
            int count = (int) raw.get("countInDeck");
            boolean isKing = (boolean) raw.get("isKing");
            String image = (String) raw.get("image");
            String icon = (String) raw.get("icon");
            Card card = new Card(id, name, hp, damage, move, attack, count, isKing, image, icon);
            cardTemplates.add(card);
        }
    }

    public List<Card> getCardTemplates() {
        return cardTemplates;
    }
}