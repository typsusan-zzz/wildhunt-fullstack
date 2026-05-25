package com.wildhunt.web.ws;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wildhunt.service.FriendService;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.PlayerPresenceService;
import com.wildhunt.service.RealtimeSessionService;
import com.wildhunt.service.event.FriendChatRealtimeEvent;
import com.wildhunt.service.event.FriendRequestRealtimeEvent;
import com.wildhunt.service.event.PresenceChangedEvent;
import com.wildhunt.service.event.RoomRealtimeEvent;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class LobbyWebSocketHandler extends TextWebSocketHandler {
    private final RealtimeSessionService sessions;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final PlayerPresenceService presenceService;
    private final FriendService friendService;

    public LobbyWebSocketHandler(RealtimeSessionService sessions, JwtService jwtService, ObjectMapper objectMapper,
                                 PlayerPresenceService presenceService, FriendService friendService) {
        this.sessions = sessions;
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
        this.presenceService = presenceService;
        this.friendService = friendService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = jwtService.parseUserId(query(session, "token"));
        if (userId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("UNAUTHORIZED"));
            return;
        }
        session.getAttributes().put("userId", userId);
        sessions.addUser(userId, session);
        presenceService.setOnline(userId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = session.getAttributes().get("userId") instanceof Long value ? value : null;
        sessions.remove(session);
        if (userId != null && !sessions.hasUserSessions(userId)) {
            presenceService.setOffline(userId);
        }
    }

    @EventListener
    public void onRoomEvent(RoomRealtimeEvent event) throws Exception {
        if (event.targetUserId() == null) return;
        if (!"ROOM_INVITE_RECEIVED".equals(event.type())
                && !"LOBBY_SUMMARY_UPDATED".equals(event.type())
                && !"PLAYER_ROOM_LIST_UPDATED".equals(event.type())
                && !"FRIEND_ONLINE_CHANGED".equals(event.type())) {
            return;
        }
        TextMessage message = new TextMessage(objectMapper.writeValueAsString(
                new ServerEnvelope(event.type(), String.valueOf(event.roomId()), event.message())));
        for (WebSocketSession target : sessions.userSessions(event.targetUserId())) {
            sendSafely(target, message);
        }
    }

    @EventListener
    public void onPresenceChanged(PresenceChangedEvent event) throws Exception {
        if (event.userId() == null || event.state() == null) return;
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", event.userId());
        payload.put("onlineState", event.state().state());
        payload.put("inGame", "PLAYING".equals(event.state().state()));
        if (event.state().roomId() != null) payload.put("roomId", event.state().roomId());
        if (event.state().matchId() != null) payload.put("matchId", event.state().matchId());
        TextMessage message = new TextMessage(objectMapper.writeValueAsString(
                new ServerEnvelope("FRIEND_ONLINE_CHANGED", null, payload)));
        Set<Long> targetUserIds = new HashSet<>(friendService.watchersOf(event.userId()));
        for (Long targetUserId : targetUserIds) {
            for (WebSocketSession target : sessions.userSessions(targetUserId)) {
                sendSafely(target, message);
            }
        }
    }

    @EventListener
    public void onFriendChatEvent(FriendChatRealtimeEvent event) throws Exception {
        if (event.targetUserId() == null || event.type() == null) return;
        TextMessage message = new TextMessage(objectMapper.writeValueAsString(
                new ServerEnvelope(event.type(), null, event.message())));
        for (WebSocketSession target : sessions.userSessions(event.targetUserId())) {
            sendSafely(target, message);
        }
    }

    @EventListener
    public void onFriendRequestEvent(FriendRequestRealtimeEvent event) throws Exception {
        if (event.targetUserId() == null || event.type() == null) return;
        TextMessage message = new TextMessage(objectMapper.writeValueAsString(
                new ServerEnvelope(event.type(), null, event.message())));
        for (WebSocketSession target : sessions.userSessions(event.targetUserId())) {
            sendSafely(target, message);
        }
    }

    private void sendSafely(WebSocketSession target, TextMessage message) {
        if (target == null || !target.isOpen()) return;
        try {
            target.sendMessage(message);
        } catch (Exception ignored) {
            sessions.remove(target);
        }
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
