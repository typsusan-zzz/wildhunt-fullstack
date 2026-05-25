package com.wildhunt.service.dto;

import com.wildhunt.common.enums.RoomStatus;
import java.util.List;

public record RoomSnapshot(
        Long id,
        String roomCode,
        String name,
        RoomStatus status,
        Long ownerUserId,
        int maxPlayers,
        int aiDeerCount,
        Long currentMatchId,
        int memberCount,
        List<RoomMemberDto> members,
        String inviteLink,
        NetworkQuality networkQuality
) {
    public record NetworkQuality(String level, int avgPingMs, int maxPingMs, String updatedAt) {
    }
}
