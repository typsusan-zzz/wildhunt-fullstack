package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class LeaderboardServiceTest {
    @Test
    void trophyLeaderboardOrdersByTrophies() {
        UserService userService = new UserService();
        long first = userService.createGuestUser().userId();
        long second = userService.createGuestUser().userId();
        userService.recordMatch(first, true, 20, 10);
        userService.recordMatch(second, true, 20, 40);

        var top = new LeaderboardService(userService).top("TROPHY", 10);

        assertEquals(second, top.get(0).userId());
        assertEquals(first, top.get(1).userId());
        assertEquals(40, top.get(0).score());
        assertEquals(40, top.get(0).trophies());
    }

    @Test
    void winsLeaderboardOrdersByWinsAndDisplaysWinScore() {
        UserService userService = new UserService();
        long first = userService.createGuestUser().userId();
        long second = userService.createGuestUser().userId();
        userService.recordMatch(first, true, 20, 10);
        userService.recordMatch(second, true, 20, 10);
        userService.recordMatch(second, true, 20, 10);

        var top = new LeaderboardService(userService).top("WINS", 10);

        assertEquals(second, top.get(0).userId());
        assertEquals(2, top.get(0).score());
        assertEquals("WINS", top.get(0).leaderboardType());
    }
}
