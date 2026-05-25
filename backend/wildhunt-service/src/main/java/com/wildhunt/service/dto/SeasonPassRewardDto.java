package com.wildhunt.service.dto;

import java.util.Map;

public record SeasonPassRewardDto(
        String track,
        int level,
        String label,
        Map<String, Object> reward,
        boolean claimable,
        boolean claimed,
        boolean locked
) {
}
