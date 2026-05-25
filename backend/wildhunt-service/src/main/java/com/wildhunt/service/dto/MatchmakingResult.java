package com.wildhunt.service.dto;

import com.wildhunt.common.enums.RoleType;

public record MatchmakingResult(
        String status,
        Long roomId,
        Long matchId,
        RoleType assignedRole,
        RoomSnapshot room
) {
    public static MatchmakingResult waiting() {
        return new MatchmakingResult("WAITING", null, null, null, null);
    }

    public static MatchmakingResult matched(RoomSnapshot room, Long matchId, RoleType role) {
        return new MatchmakingResult("MATCHED", room.id(), matchId == null ? room.currentMatchId() : matchId, role, room);
    }
}
