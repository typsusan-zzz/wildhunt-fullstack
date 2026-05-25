package com.wildhunt.service.dto;

public record LeaderboardEntryDto(
        int rank,
        Long userId,
        String nickname,
        String leaderboardType,
        int score,
        int rating,
        int level,
        int trophies,
        int wins,
        int wolfWins,
        int deerSurvivals
) {
}
