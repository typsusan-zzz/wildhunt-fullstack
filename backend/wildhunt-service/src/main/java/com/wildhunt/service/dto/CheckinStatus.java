package com.wildhunt.service.dto;

import java.time.LocalDate;
import java.util.List;

public record CheckinStatus(
        boolean claimedToday,
        int streakDays,
        int totalDays,
        List<RewardPreview> rewards,
        LocalDate serverDate
) {
    public record RewardPreview(int day, int exp, String assetCode, boolean claimed) {
    }
}
