package com.wildhunt.service.dto;

public record UserProfile(
        Long userId,
        String username,
        String nickname,
        String avatarUrl,
        int rating,
        int level,
        int exp,
        int trophies,
        int totalMatches,
        int totalWins,
        String title,
        boolean guideSeen,
        int unreadNotifications
) {
    public UserProfile(Long userId, String username, String nickname, String avatarUrl, int rating, int level, int exp) {
        this(userId, username, nickname, avatarUrl, rating, level, exp, 0, 0, 0, null, false, 0);
    }
}
