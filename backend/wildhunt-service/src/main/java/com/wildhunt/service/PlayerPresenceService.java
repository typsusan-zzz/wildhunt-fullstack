package com.wildhunt.service;

import com.wildhunt.service.event.PresenceChangedEvent;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
public class PlayerPresenceService {
    private static final PresenceState OFFLINE = new PresenceState("OFFLINE", null, null);
    private static final PresenceState ONLINE = new PresenceState("ONLINE", null, null);
    private final Map<Long, PresenceState> states = new ConcurrentHashMap<>();
    private final ApplicationEventPublisher events;

    public PlayerPresenceService() {
        this(event -> {
        });
    }

    @Autowired
    public PlayerPresenceService(ApplicationEventPublisher events) {
        this.events = events;
    }

    public PresenceState stateOf(Long userId) {
        if (userId == null) return OFFLINE;
        return states.getOrDefault(userId, OFFLINE);
    }

    public void setOnline(Long userId) {
        if (userId == null) return;
        change(userId, old -> isActive(old) ? old : ONLINE);
    }

    public void setOffline(Long userId) {
        if (userId == null) return;
        change(userId, old -> OFFLINE);
    }

    public void setMatching(Long userId) {
        if (userId == null) return;
        change(userId, old -> {
            if ("PLAYING".equals(old.state()) || "IN_ROOM".equals(old.state())) return old;
            return new PresenceState("MATCHING", null, null);
        });
    }

    public void setInRoom(Long userId, Long roomId) {
        if (userId == null) return;
        change(userId, old -> new PresenceState("IN_ROOM", roomId, null));
    }

    public void setPlaying(Long userId, Long matchId) {
        if (userId == null) return;
        change(userId, old -> new PresenceState("PLAYING", null, matchId));
    }

    public void clearMatching(Long userId) {
        if (userId == null) return;
        change(userId, old -> "MATCHING".equals(old.state()) ? ONLINE : old);
    }

    public void clearRoom(Long userId) {
        if (userId == null) return;
        change(userId, old -> "IN_ROOM".equals(old.state()) ? ONLINE : old);
    }

    public void clearPlaying(Long userId) {
        if (userId == null) return;
        change(userId, old -> "PLAYING".equals(old.state()) ? ONLINE : old);
    }

    public void clearAllMatching() {
        for (Long userId : states.keySet()) {
            clearMatching(userId);
        }
    }

    public void clearAll() {
        for (Long userId : states.keySet()) {
            change(userId, old -> ONLINE);
        }
    }

    private boolean isActive(PresenceState state) {
        return "MATCHING".equals(state.state()) || "IN_ROOM".equals(state.state()) || "PLAYING".equals(state.state());
    }

    private void change(Long userId, Function<PresenceState, PresenceState> nextState) {
        AtomicReference<PresenceState> oldRef = new AtomicReference<>(OFFLINE);
        AtomicReference<PresenceState> nextRef = new AtomicReference<>(OFFLINE);
        states.compute(userId, (id, previous) -> {
            PresenceState old = previous == null ? OFFLINE : previous;
            PresenceState next = nextState.apply(old);
            if (next == null) next = OFFLINE;
            oldRef.set(old);
            nextRef.set(next);
            return "OFFLINE".equals(next.state()) ? null : next;
        });
        publishIfChanged(userId, oldRef.get(), nextRef.get());
    }

    private void publishIfChanged(Long userId, PresenceState oldState, PresenceState nextState) {
        if (!Objects.equals(oldState, nextState)) {
            events.publishEvent(new PresenceChangedEvent(userId, nextState));
        }
    }

    public record PresenceState(String state, Long roomId, Long matchId) {
    }
}
