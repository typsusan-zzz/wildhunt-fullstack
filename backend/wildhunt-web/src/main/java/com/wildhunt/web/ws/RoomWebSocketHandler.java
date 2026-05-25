package com.wildhunt.web.ws;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.RealtimeSessionService;
import com.wildhunt.service.RoomChatService;
import com.wildhunt.service.RoomService;
import com.wildhunt.service.event.RoomRealtimeEvent;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class RoomWebSocketHandler extends TextWebSocketHandler {
    private final RealtimeSessionService sessions;
    private final RoomService roomService;
    private final RoomChatService roomChatService;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    public RoomWebSocketHandler(
            RealtimeSessionService sessions,
            RoomService roomService,
            RoomChatService roomChatService,
            JwtService jwtService,
            ObjectMapper objectMapper) {
        this.sessions = sessions;
        this.roomService = roomService;
        this.roomChatService = roomChatService;
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String roomId = query(session, "roomId");
        String token = query(session, "token");
        Long userId = jwtService.parseUserId(token);
        if (roomId == null || userId == null || !roomService.isActiveMember(userId, Long.valueOf(roomId))) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("NOT_ROOM_MEMBER"));
            return;
        }
        session.getAttributes().put("roomId", roomId);
        session.getAttributes().put("userId", userId);
        sessions.add(roomId, session);
        session.sendMessage(json(new ServerEnvelope("ROOM_SNAPSHOT", roomId, roomService.getRoom(Long.valueOf(roomId)))));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String roomId = (String) session.getAttributes().get("roomId");
        Long userId = (Long) session.getAttributes().get("userId");
        if (roomId == null || userId == null) return;
        JsonNode json = objectMapper.readTree(message.getPayload());
        String type = json.path("type").asText();
        if ("ROOM_CHAT_SEND".equals(type)) {
            roomChatService.sendMessage(userId, Long.valueOf(roomId), json.path("content").asText());
            return;
        }
        if ("PING".equals(type)) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                    java.util.Map.of("type", "PONG", "sentAt", json.path("sentAt").asLong(), "serverAt", System.currentTimeMillis()))));
            return;
        }
        broadcastRaw(roomId, message);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    private void broadcast(String roomId, ServerEnvelope envelope) throws Exception {
        TextMessage message = json(envelope);
        broadcastRaw(roomId, message);
    }

    private void broadcastRaw(String roomId, TextMessage message) throws Exception {
        for (WebSocketSession target : sessions.sessions(roomId)) {
            if (target.isOpen()) target.sendMessage(message);
        }
    }

    @EventListener
    public void onRoomEvent(RoomRealtimeEvent event) throws Exception {
        TextMessage message = json(new ServerEnvelope(event.type(), String.valueOf(event.roomId()), event.message()));
        for (WebSocketSession target : sessions.sessions(String.valueOf(event.roomId()))) {
            if (!target.isOpen()) continue;
            if (event.targetUserId() != null && !event.targetUserId().equals(target.getAttributes().get("userId"))) continue;
            target.sendMessage(message);
        }
    }

    private TextMessage json(ServerEnvelope envelope) throws Exception {
        return new TextMessage(objectMapper.writeValueAsString(envelope));
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

    private record ServerEnvelope(String type, String roomId, Object message) {
    }
}
