 package com.example.cardgame.controller;

import com.example.cardgame.model.GameState;
import com.example.cardgame.model.Player;
import com.example.cardgame.service.GameService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class GameWebSocketHandler extends TextWebSocketHandler {

    private final GameService gameService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    // 存储所有活跃会话
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public GameWebSocketHandler(GameService gameService) {
        this.gameService = gameService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.put(session.getId(), session);
        // 发送当前完整游戏状态给新连接的客户端
        sendState(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        Map<String, Object> json = objectMapper.readValue(payload, Map.class);
        String action = (String) json.get("action");

        try {
            switch (action) {
                case "move":
                    Player player = Player.valueOf((String) json.get("player"));
                    int fromX = (int) json.get("fromX");
                    int fromY = (int) json.get("fromY");
                    int toX = (int) json.get("toX");
                    int toY = (int) json.get("toY");
                    gameService.moveUnit(player, fromX, fromY, toX, toY);
                    break;
                case "draw":
                    Player drawPlayer = Player.valueOf((String) json.get("player"));
                    gameService.drawCard(drawPlayer);
                    break;
                case "reset":
                    gameService.resetGame();
                    break;
                default:
                    // 未知 action
                    return;
            }
            // 任何有效操作后广播新状态
            broadcastState();
        } catch (Exception e) {
            e.printStackTrace();
            // 可向当前会话发送错误消息，但为简洁略过
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        sessions.remove(session.getId());
        exception.printStackTrace();
    }

    private void sendState(WebSocketSession session) {
        try {
            GameState state = gameService.getState();
            String stateJson = objectMapper.writeValueAsString(state);
            session.sendMessage(new TextMessage(stateJson));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void broadcastState() {
        try {
            GameState state = gameService.getState();
            String stateJson = objectMapper.writeValueAsString(state);
            for (WebSocketSession session : sessions.values()) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(stateJson));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}