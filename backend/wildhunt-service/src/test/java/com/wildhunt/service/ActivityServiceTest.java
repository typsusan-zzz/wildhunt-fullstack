package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.wildhunt.common.exception.BizException;
import org.junit.jupiter.api.Test;

class ActivityServiceTest {
    @Test
    void claimGrantsRewardOnce() {
        UserService userService = new UserService();
        UserAssetService assets = new UserAssetService();
        ActivityService activityService = new ActivityService(userService, assets, new NotificationService(userService));
        long userId = userService.createGuestUser().userId();
        long activityId = activityService.list(userId).get(0).id();

        var claimed = activityService.claim(userId, activityId);

        assertFalse(claimed.claimable());
        assertEquals(200, userService.get(userId).exp());
        assertThrows(BizException.class, () -> activityService.claim(userId, activityId));
    }

    @Test
    void matchActivityRequiresMatchProgress() {
        UserService userService = new UserService();
        UserAssetService assets = new UserAssetService();
        ActivityService activityService = new ActivityService(userService, assets, new NotificationService(userService));
        long userId = userService.createGuestUser().userId();
        var firstMatch = activityService.list(userId).stream()
                .filter(item -> item.code().equals("FIRST_MATCH"))
                .findFirst()
                .orElseThrow();

        assertFalse(firstMatch.claimable());
        assertEquals(0, firstMatch.progress());

        userService.recordMatch(userId, true, 60, 30);
        var unlocked = activityService.list(userId).stream()
                .filter(item -> item.code().equals("FIRST_MATCH"))
                .findFirst()
                .orElseThrow();

        assertTrue(unlocked.claimable());
        assertEquals(1, unlocked.progress());
        activityService.claim(userId, unlocked.id());
        assertEquals(180, userService.get(userId).exp());
    }

    @Test
    void adminCanCreateActivityAndResetClaims() {
        UserService userService = new UserService();
        UserAssetService assets = new UserAssetService();
        ActivityService activityService = new ActivityService(userService, assets, new NotificationService(userService));
        long userId = userService.createGuestUser().userId();

        var created = activityService.create(new com.wildhunt.service.dto.ActivityAdminRequest(
                "LOGIN_BONUS_TEST", "Login bonus", "Test bonus", "LOGIN", 1, "Login once",
                java.util.Map.of("exp", 15), null, null, "ACTIVE"));
        activityService.claim(userId, created.id());

        assertEquals(15, userService.get(userId).exp());
        assertEquals(1, activityService.resetClaims(userId).get("removed"));
        assertTrue(activityService.list(userId).stream()
                .filter(item -> item.code().equals("LOGIN_BONUS_TEST"))
                .findFirst()
                .orElseThrow()
                .claimable());
    }
}
