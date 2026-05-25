package com.wildhunt.service.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record ActivityDto(
        Long id,
        String code,
        String title,
        String description,
        String activityType,
        Map<String, Object> reward,
        String condition,
        int progress,
        int target,
        boolean claimable,
        boolean claimed,
        boolean expired,
        LocalDateTime startsAt,
        LocalDateTime endsAt
) {
}
