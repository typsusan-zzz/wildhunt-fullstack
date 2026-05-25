package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.wildhunt.common.enums.RoleType;
import com.wildhunt.service.dto.UserProfile;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
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

    @Test
    @SuppressWarnings("unchecked")
    void deerDecoyCanOnlyBeUsedOnceAndDoesNotChangeTargetCount() {
        UserService userService = new UserService();
        GameMatchService gameMatchService = new GameMatchService(userService);
        long wolf = userService.createGuestUser().userId();
        long deer = userService.createGuestUser().userId();
        var match = gameMatchService.createMatch(null, List.of(
                new GameMatchService.PlayerAssignment(wolf, RoleType.WOLF),
                new GameMatchService.PlayerAssignment(deer, RoleType.DEER)
        ), 16);

        var first = gameMatchService.applyInput(match.matchId(), deer, Map.of("deerCamouflage", true));
        Map<String, Object> firstConfirm = (Map<String, Object>) first.snapshot().get("skillConfirm");
        List<Map<String, Object>> firstPlayers = (List<Map<String, Object>>) first.snapshot().get("players");

        assertEquals("DEER_DECOY", firstConfirm.get("type"));
        assertEquals(true, firstConfirm.get("confirmed"));
        assertEquals(2, firstPlayers.stream().filter(player -> Boolean.TRUE.equals(player.get("decoy"))).count());
        assertEquals(0, first.snapshot().get("foundReal"));
        assertEquals(1, first.snapshot().get("realTotal"));

        var repeated = gameMatchService.applyInput(match.matchId(), deer, Map.of("deerCamouflage", true));
        Map<String, Object> repeatConfirm = (Map<String, Object>) repeated.snapshot().get("skillConfirm");

        assertEquals("DEER_DECOY", repeatConfirm.get("type"));
        assertEquals(false, repeatConfirm.get("confirmed"));
        assertEquals("USED", repeatConfirm.get("reason"));
        assertFalse(repeated.matchEnded());
    }

    @Test
    void concurrentSettleOnlyRecordsEachPlayerOnce() throws Exception {
        CountingUserService userService = new CountingUserService();
        GameMatchService gameMatchService = new GameMatchService(userService);
        long wolf = userService.createGuestUser().userId();
        long deer = userService.createGuestUser().userId();
        long matchId = gameMatchService.createMatch(null, List.of(
                new GameMatchService.PlayerAssignment(wolf, RoleType.WOLF),
                new GameMatchService.PlayerAssignment(deer, RoleType.DEER)
        ), 16).matchId();
        int threads = 12;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            futures.add(executor.submit(() -> {
                ready.countDown();
                assertTrue(start.await(2, TimeUnit.SECONDS));
                gameMatchService.settle(matchId, true);
                return null;
            }));
        }

        assertTrue(ready.await(2, TimeUnit.SECONDS));
        start.countDown();
        for (Future<?> future : futures) {
            future.get(3, TimeUnit.SECONDS);
        }
        executor.shutdownNow();

        assertEquals("FINISHED", gameMatchService.get(matchId).status());
        assertEquals(2, userService.recordMatchCalls());
        assertEquals(1, userService.getOrCreate(wolf).totalMatches());
        assertEquals(1, userService.getOrCreate(deer).totalMatches());
        assertEquals(1, userService.getOrCreate(wolf).totalWins());
        assertEquals(0, userService.getOrCreate(deer).totalWins());
    }

    private static final class CountingUserService extends UserService {
        private final AtomicInteger recordMatchCalls = new AtomicInteger();

        @Override
        public UserProfile recordMatch(Long userId, boolean win, int expDelta, int trophyDelta) {
            recordMatchCalls.incrementAndGet();
            try {
                Thread.sleep(25);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
            }
            return super.recordMatch(userId, win, expDelta, trophyDelta);
        }

        int recordMatchCalls() {
            return recordMatchCalls.get();
        }
    }
}
