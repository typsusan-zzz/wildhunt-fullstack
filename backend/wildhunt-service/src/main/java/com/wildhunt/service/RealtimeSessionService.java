package com.wildhunt.service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

@Service
public class RealtimeSessionService {
    private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();
    private final Map<Long, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    public void add(String roomId, WebSocketSession session) {
        roomSessions.computeIfAbsent(roomId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
    }

    public void addUser(Long userId, WebSocketSession session) {
        userSessions.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
    }

    public void remove(WebSocketSession session) {
        for (Set<WebSocketSession> sessions : roomSessions.values()) {
            sessions.remove(session);
        }
        for (Set<WebSocketSession> sessions : userSessions.values()) {
            sessions.remove(session);
        }
    }

    public boolean hasUserSessions(Long userId) {
        return userSessions.getOrDefault(userId, Set.of()).stream().anyMatch(WebSocketSession::isOpen);
    }

    public Set<WebSocketSession> sessions(String roomId) {
        return roomSessions.getOrDefault(roomId, Set.of());
    }

    public Set<WebSocketSession> userSessions(Long userId) {
        return userSessions.getOrDefault(userId, Set.of());
    }
}
