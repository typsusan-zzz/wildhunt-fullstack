package com.wildhunt.service;

import com.wildhunt.common.enums.QueueType;
import com.wildhunt.service.dto.LobbySummary;
import org.springframework.stereotype.Service;

@Service
public class LobbyService {
    private final RoomService roomService;
    private final MatchmakingService matchmakingService;

    public LobbyService(RoomService roomService, MatchmakingService matchmakingService) {
        this.roomService = roomService;
        this.matchmakingService = matchmakingService;
    }

    public LobbySummary summary() {
        int waiting = roomService.listPublicRooms().size();
        int wolf = matchmakingService.queueCount(QueueType.WOLF);
        int deer = matchmakingService.queueCount(QueueType.DEER);
        return new LobbySummary(Math.max(1, waiting + wolf + deer), waiting, 0, wolf, deer);
    }
}
