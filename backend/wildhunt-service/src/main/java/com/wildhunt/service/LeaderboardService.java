package com.wildhunt.service;

import com.wildhunt.service.dto.LeaderboardEntryDto;
import com.wildhunt.service.dto.UserProfile;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class LeaderboardService {
    private final UserService userService;

    public LeaderboardService(UserService userService) {
        this.userService = userService;
    }

    public List<LeaderboardEntryDto> top(String type, int limit) {
        String normalizedType = normalizeType(type);
        List<UserProfile> users = userService.allUsers().stream().toList();
        if (users.isEmpty()) {
            users = List.of(
                    new UserProfile(10001L, "wild_star", "荒野新星", null, 1180, 8, 720, 620, 12, 7, "狼王", true, 0),
                    new UserProfile(10002L, "pine_shadow", "松林潜行者", null, 1120, 6, 560, 540, 9, 5, "鹿群哨兵", true, 0),
                    new UserProfile(10003L, "moon_hunter", "月影猎手", null, 1088, 5, 430, 490, 8, 4, "追猎者", true, 0));
        }
        Comparator<UserProfile> comparator = switch (normalizedType) {
            case "WINS" -> Comparator.comparingInt(UserProfile::totalWins).reversed();
            case "RATING" -> Comparator.comparingInt(UserProfile::rating).reversed();
            default -> Comparator.comparingInt(UserProfile::trophies).reversed();
        };
        int[] rank = {1};
        return users.stream()
                .sorted(comparator.thenComparing(UserProfile::nickname))
                .limit(Math.max(1, Math.min(limit, 50)))
                .map(user -> new LeaderboardEntryDto(rank[0]++, user.userId(), user.nickname(), normalizedType,
                        score(user, normalizedType), user.rating(), user.level(), user.trophies(), user.totalWins(),
                        Math.max(0, user.totalWins() / 2), Math.max(0, user.totalWins() - user.totalWins() / 2)))
                .toList();
    }

    public Map<String, Object> clearData() {
        return Map.of("profilesReset", userService.resetLeaderboardStats());
    }

    private static String normalizeType(String type) {
        String normalized = type == null ? "TROPHY" : type.trim().toUpperCase();
        return switch (normalized) {
            case "RATING", "WINS" -> normalized;
            default -> "TROPHY";
        };
    }

    private static int score(UserProfile user, String type) {
        return switch (type) {
            case "WINS" -> user.totalWins();
            case "RATING" -> user.rating();
            default -> user.trophies();
        };
    }
}
