package com.wildhunt.service.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CheckinAdminRecord(
        Long id,
        Long userId,
        LocalDate checkinDate,
        int streakDays,
        int rewardExp,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
