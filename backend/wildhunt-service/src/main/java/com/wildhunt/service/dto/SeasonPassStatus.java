package com.wildhunt.service.dto;

import java.util.List;

public record SeasonPassStatus(
        String seasonCode,
        String seasonName,
        int level,
        int exp,
        int expIntoLevel,
        int expForNextLevel,
        int progressPercent,
        int maxLevel,
        boolean premiumUnlocked,
        List<SeasonPassRewardDto> freeRewards,
        List<SeasonPassRewardDto> premiumRewards
) {
}
