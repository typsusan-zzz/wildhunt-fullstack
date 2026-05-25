package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.wildhunt.common.exception.BizException;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class CheckinServiceTest {
    @Test
    void claimAddsExperienceAndPreventsDuplicateClaim() {
        UserService userService = new UserService();
        CheckinService checkinService = service(userService);
        long userId = userService.createGuestUser().userId();

        var status = checkinService.claim(userId);

        assertTrue(status.claimedToday());
        assertEquals(50, userService.get(userId).exp());
        assertThrows(BizException.class, () -> checkinService.claim(userId));
    }

    @Test
    void adminGrantBackfillsRecordsAndResetRemovesThem() {
        UserService userService = new UserService();
        CheckinService checkinService = service(userService);
        long userId = userService.createGuestUser().userId();

        var record = checkinService.adminGrant(userId, LocalDate.now().minusDays(1), null, null, true);

        assertEquals(userId, record.userId());
        assertEquals(50, userService.get(userId).exp());
        assertEquals(1, checkinService.adminRecords(userId, 10).size());
        assertEquals(1, checkinService.status(userId).streakDays());

        var reset = checkinService.resetUser(userId);
        assertEquals(1, reset.get("removed"));
        assertTrue(checkinService.adminRecords(userId, 10).isEmpty());
    }

    @Test
    void rewardConfigChangesClaimReward() {
        UserService userService = new UserService();
        CheckinService checkinService = service(userService);
        long userId = userService.createGuestUser().userId();

        checkinService.updateConfig(List.of(7, 9, 11));
        var status = checkinService.claim(userId);

        assertEquals(List.of(7, 9, 11), checkinService.config().rewards());
        assertEquals(7, userService.get(userId).exp());
        assertEquals(3, status.rewards().size());
    }

    private static CheckinService service(UserService userService) {
        UserAssetService assets = new UserAssetService();
        NotificationService notifications = new NotificationService(userService);
        return new CheckinService(userService, assets, notifications);
    }
}
