package com.wildhunt.service.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record NotificationDto(
        Long id,
        Long userId,
        String type,
        String title,
        String content,
        Map<String, Object> payload,
        boolean read,
        LocalDateTime createdAt
) {
}
