package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.wildhunt.service.event.PresenceChangedEvent;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class PlayerPresenceServiceTest {
    @Test
    void presencePublishesRealtimeStateChanges() {
        List<PresenceChangedEvent> events = new ArrayList<>();
        PlayerPresenceService service = new PlayerPresenceService(event -> {
            if (event instanceof PresenceChangedEvent presenceEvent) events.add(presenceEvent);
        });
        long userId = 1001L;

        assertEquals("OFFLINE", service.stateOf(userId).state());

        service.setOnline(userId);
        service.setMatching(userId);
        service.clearMatching(userId);
        service.setInRoom(userId, 2002L);
        service.setPlaying(userId, 3003L);
        service.setOffline(userId);

        assertEquals("OFFLINE", service.stateOf(userId).state());
        assertEquals(List.of("ONLINE", "MATCHING", "ONLINE", "IN_ROOM", "PLAYING", "OFFLINE"),
                events.stream().map(event -> event.state().state()).toList());
        assertEquals(2002L, events.get(3).state().roomId());
        assertEquals(3003L, events.get(4).state().matchId());
    }

    @Test
    void reconnectDoesNotOverwriteActiveState() {
        PlayerPresenceService service = new PlayerPresenceService(event -> {
        });
        long userId = 1001L;

        service.setInRoom(userId, 2002L);
        service.setOnline(userId);

        assertEquals("IN_ROOM", service.stateOf(userId).state());
        assertEquals(2002L, service.stateOf(userId).roomId());
    }
}
