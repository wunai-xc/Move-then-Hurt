package com.example.movethenhurt.controller;

import com.example.movethenhurt.model.Player;
import com.example.movethenhurt.service.GameService;
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
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, Player> sessionPlayers = new ConcurrentHashMap<>();
    private Player nextPlayer = Player.RED;

    public GameWebSocketHandler(GameService gameService) {
        this.gameService = gameService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.put(session.getId(), session);
        assignPlayer(session);
        sendState(session);
    }

    private void assignPlayer(WebSocketSession session) {
        synchronized (this) {
            Player assignedPlayer = nextPlayer;
            sessionPlayers.put(session.getId(), assignedPlayer);
            nextPlayer = nextPlayer == Player.RED ? Player.BLUE : Player.RED;
            try {
                Map<String, Object> initMsg = new ConcurrentHashMap<>();
                initMsg.put("type", "playerAssigned");
                initMsg.put("player", assignedPlayer.name());
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(initMsg)));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
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
                case "deploy":
                    Player deployPlayer = Player.valueOf((String) json.get("player"));
                    int cardIndex = (int) json.get("cardIndex");
                    int row = (int) json.get("row");
                    int col = (int) json.get("col");
                    gameService.deployUnit(deployPlayer, cardIndex, row, col);
                    break;
                case "reset":
                    gameService.resetGame();
                    break;
                default:
                    return;
            }
            broadcastState();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session.getId());
        sessionPlayers.remove(session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        sessions.remove(session.getId());
        sessionPlayers.remove(session.getId());
        exception.printStackTrace();
    }

    private void sendState(WebSocketSession session) {
        try {
            String stateJson = objectMapper.writeValueAsString(gameService.getState());
            session.sendMessage(new TextMessage(stateJson));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void broadcastState() {
        try {
            String stateJson = objectMapper.writeValueAsString(gameService.getState());
            for (WebSocketSession sess : sessions.values()) {
                if (sess.isOpen()) {
                    sess.sendMessage(new TextMessage(stateJson));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}