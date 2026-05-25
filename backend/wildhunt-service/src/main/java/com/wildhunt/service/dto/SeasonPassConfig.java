package com.wildhunt.service.dto;

import java.util.List;

public record SeasonPassConfig(
        String seasonCode,
        String seasonName,
        int maxLevel,
        List<SeasonPassConfigReward> freeRewards,
        List<SeasonPassConfigReward> premiumRewards
) {
    public record SeasonPassConfigReward(int level, String token, String label) {
    }
}
