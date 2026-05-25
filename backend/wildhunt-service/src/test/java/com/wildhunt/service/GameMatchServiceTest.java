package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.wildhunt.common.enums.RoleType;
import java.util.List;
import org.junit.jupiter.api.Test;

class GameMatchServiceTest {
    @Test
    void leavingCurrentMatchSettlesAndClearsCurrentMatch() {
        UserService userService = new UserService();
        GameMatchService gameMatchService = new GameMatchService(userService);
        long wolf = userService.createGuestUser().userId();
        long deer = userService.createGuestUser().userId();

        gameMatchService.createMatch(null, List.of(
                new GameMatchService.PlayerAssignment(wolf, RoleType.WOLF),
                new GameMatchService.PlayerAssignment(deer, RoleType.DEER)
        ), 16);
        var finished = gameMatchService.leaveCurrent(deer);

        assertEquals("FINISHED", finished.status());
        assertNull(gameMatchService.current(wolf));
        assertNull(gameMatchService.current(deer));
        assertEquals(1, userService.getOrCreate(wolf).totalWins());
        assertEquals(0, userService.getOrCreate(deer).totalWins());
    }
}
