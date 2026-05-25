package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.wildhunt.common.enums.QueueType;
import org.junit.jupiter.api.Test;

class MatchmakingServiceTest {
    @Test
    void deerCanStartWithAiWolfForSoloPlay() {
        UserService userService = new UserService();
        RoomService roomService = new RoomService(userService, new GameMatchService(userService), event -> {});
        MatchmakingService matchmakingService = new MatchmakingService(roomService);
        long deer = userService.createGuestUser().userId();

        var matched = matchmakingService.enqueue(deer, QueueType.DEER);
        var deerStatus = matchmakingService.status(deer);

        assertEquals("MATCHED", matched.status());
        assertEquals(matched.matchId(), deerStatus.matchId());
        assertEquals(com.wildhunt.common.enums.RoleType.DEER, matched.assignedRole());
        assertNotNull(matched.room());
    }

    @Test
    void autoFillsRealWolfWhenNoGapExists() {
        UserService userService = new UserService();
        MatchmakingService matchmakingService = new MatchmakingService(new RoomService(userService, new GameMatchService(userService), event -> {}));
        long userId = userService.createGuestUser().userId();

        var matched = matchmakingService.enqueue(userId, QueueType.AUTO);

        assertEquals("MATCHED", matched.status());
        assertEquals(com.wildhunt.common.enums.RoleType.WOLF, matched.assignedRole());
        assertNotNull(matched.matchId());
    }
}
