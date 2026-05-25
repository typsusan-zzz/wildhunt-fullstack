package com.wildhunt.service.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record ActivityAdminRequest(
        String code,
        String title,
        String description,
        String activityType,
        Integer conditionValue,
        String conditionText,
        Map<String, Object> reward,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        String status
) {
}
