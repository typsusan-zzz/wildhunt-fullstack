package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.wildhunt.common.exception.BizException;
import com.wildhunt.service.dto.SeasonPassConfig;
import java.util.List;
import org.junit.jupiter.api.Test;

class SeasonPassServiceTest {
    @Test
    void addExpUnlocksLevelsAndFreeRewardClaimsOnce() {
        UserService userService = new UserService();
        SeasonPassService service = service(userService);
        long userId = userService.createGuestUser().userId();

        var status = service.addExp(userId, 2200, "TEST", "unit");

        assertEquals(3, status.level());
        assertTrue(status.freeRewards().stream().anyMatch(item -> item.level() == 3 && item.claimable()));

        service.claimReward(userId, "FREE", 1);

        assertEquals(100, userService.get(userId).exp());
        assertThrows(BizException.class, () -> service.claimReward(userId, "FREE", 1));
    }

    @Test
    void premiumRewardsRequireUnlock() {
        UserService userService = new UserService();
        SeasonPassService service = service(userService);
        long userId = userService.createGuestUser().userId();
        service.addExp(userId, 2200, "TEST", "unit");

        assertThrows(BizException.class, () -> service.claimReward(userId, "PREMIUM", 3));

        var unlocked = service.unlockPremium(userId);

        assertTrue(unlocked.premiumUnlocked());
        service.claimReward(userId, "PREMIUM", 3);
        assertEquals(200, userService.get(userId).exp());
    }

    @Test
    void adminConfigChangesRewardTrack() {
        UserService userService = new UserService();
        SeasonPassService service = service(userService);

        var config = service.updateConfig(new SeasonPassConfig("S_TEST", "Test Season", 20,
                List.of(new SeasonPassConfig.SeasonPassConfigReward(1, "EXP_7", null)),
                List.of(new SeasonPassConfig.SeasonPassConfigReward(1, "TITLE_TESTER", null))));

        assertEquals("S_TEST", config.seasonCode());
        assertEquals(20, config.maxLevel());
        assertEquals("EXP_7", config.freeRewards().get(0).token());
        assertFalse(config.premiumRewards().isEmpty());
    }

    private static SeasonPassService service(UserService userService) {
        UserAssetService assets = new UserAssetService();
        NotificationService notifications = new NotificationService(userService);
        return new SeasonPassService(userService, assets, notifications, new SystemConfigService());
    }
}
