package com.wildhunt.web.ws;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wildhunt.service.GameMatchService;
import com.wildhunt.service.GameMatchService.GameRealtimeUpdate;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.dto.MatchSnapshot;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler {
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    private final Map<String, Long> lastSeq = new ConcurrentHashMap<>();
    private final JwtService jwtService;
    private final GameMatchService gameMatchService;
    private final ObjectMapper objectMapper;

    public GameWebSocketHandler(JwtService jwtService, GameMatchService gameMatchService, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.gameMatchService = gameMatchService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = jwtService.parseUserId(query(session, "token"));
        if (userId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("UNAUTHORIZED"));
            return;
        }
        MatchSnapshot match = gameMatchService.current(userId);
        if (match == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("MATCH_NOT_FOUND"));
            return;
        }
        session.getAttributes().put("userId", userId);
        session.getAttributes().put("matchId", match.matchId());
        sessions.add(session);
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                "type", "GAME_SNAPSHOT",
                "tick", Instant.now().toEpochMilli(),
                "match", match,
                "players", match.players()))));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode json = objectMapper.readTree(message.getPayload());
        if (!"PLAYER_INPUT".equals(json.path("type").asText())) return;
        Long userId = attrLong(session, "userId");
        Long matchId = attrLong(session, "matchId");
        if (userId == null || matchId == null) return;
        String key = userId + ":" + matchId;
        long seq = json.path("seq").asLong(-1);
        long old = lastSeq.getOrDefault(key, -1L);
        if (seq <= old) return;
        lastSeq.put(key, seq);

        Map<String, Object> input = objectMapper.convertValue(json.path("input"), new TypeReference<Map<String, Object>>() {
        });
        GameRealtimeUpdate update = gameMatchService.applyInput(matchId, userId, input);
        Map<String, Object> snapshot = update.snapshot();
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "GAME_SNAPSHOT");
        payload.put("tick", Instant.now().toEpochMilli());
        payload.put("matchId", matchId);
        payload.put("snapshot", snapshot);
        payload.put("players", snapshot.getOrDefault("players", List.of()));
        broadcast(matchId, payload);
        if (update.matchEnded()) {
            broadcast(matchId, Map.of(
                    "type", "MATCH_END",
                    "matchId", matchId,
                    "result", Map.of(
                            "title", update.wolfWin() ? "狼方胜利" : "鹿群胜利",
                            "detail", update.wolfWin() ? "服务端判定全部目标鹿已被找出。" : "服务端倒计时结束，仍有鹿存活。",
                            "wolfWin", update.wolfWin(),
                            "expDelta", update.wolfWin() ? 60 : 20,
                            "trophyDelta", update.wolfWin() ? 30 : -10
                    )));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    private void broadcast(Long matchId, Map<String, Object> payload) throws Exception {
        String encoded = objectMapper.writeValueAsString(payload);
        for (WebSocketSession target : sessions) {
            if (!target.isOpen()) continue;
            if (!matchId.equals(attrLong(target, "matchId"))) continue;
            target.sendMessage(new TextMessage(encoded));
        }
    }

    private static Long attrLong(WebSocketSession session, String key) {
        Object value = session.getAttributes().get(key);
        if (value instanceof Long id) return id;
        if (value instanceof Number number) return number.longValue();
        return null;
    }

    private static String query(WebSocketSession session, String key) {
        if (session.getUri() == null || session.getUri().getRawQuery() == null) return null;
        for (String pair : session.getUri().getRawQuery().split("&")) {
            String[] parts = pair.split("=", 2);
            if (parts.length == 2 && parts[0].equals(key)) {
                return URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}
