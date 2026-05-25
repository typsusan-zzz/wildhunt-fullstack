package com.wildhunt.service.dto;

import com.wildhunt.common.enums.RoleType;
import java.util.List;
import java.util.Map;

public record MatchSnapshot(
        Long matchId,
        Long roomId,
        String status,
        long matchSeed,
        Map<String, Object> gameConfig,
        List<Player> players
) {
    public record Player(Long userId, String nickname, RoleType roleType, boolean ai) {
    }
}
