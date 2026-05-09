// WebSocketConfig.java
package com.example.cardgame.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;
import com.example.cardgame.controller.GameWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new GameWebSocketHandler(), "/game").setAllowedOrigins("*");
    }
}

// GameWebSocketHandler.java
package com.example.cardgame.controller;
import com.example.cardgame.service.GameService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.socket.*;
import java.util.concurrent.CopyOnWriteArraySet;

public class GameWebSocketHandler implements WebSocketHandler {
    private static CopyOnWriteArraySet<WebSocketSession> sessions = new CopyOnWriteArraySet<>();
    private GameService gameService = new GameService(); // 实际应注入Spring Bean
    private ObjectMapper mapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        sendState(session);
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        String payload = (String) message.getPayload();
        var json = mapper.readTree(payload);
        String action = json.get("action").asText();
        if ("move".equals(action)) {
            Player player = Player.valueOf(json.get("player").asText());
            int fx = json.get("fromX").asInt(), fy = json.get("fromY").asInt();
            int tx = json.get("toX").asInt(), ty = json.get("toY").asInt();
            gameService.moveUnit(player, fx, fy, tx, ty);
        } else if ("draw".equals(action)) {
            Player player = Player.valueOf(json.get("player").asText());
            gameService.drawCard(player);
        } else if ("reset".equals(action)) {
            gameService.resetGame();
        }
        broadcastState();
    }

    private void broadcastState() {
        try {
            String stateJson = mapper.writeValueAsString(gameService.getState());
            for (WebSocketSession sess : sessions) {
                sess.sendMessage(new TextMessage(stateJson));
            }
        } catch (Exception e) { e.printStackTrace(); }
    }
    // ... 其他重载方法
}