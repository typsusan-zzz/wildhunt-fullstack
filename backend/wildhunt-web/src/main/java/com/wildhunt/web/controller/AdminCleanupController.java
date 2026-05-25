package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.service.FriendService;
import com.wildhunt.service.LeaderboardService;
import com.wildhunt.service.MatchmakingService;
import com.wildhunt.service.RoomService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/cleanup")
public class AdminCleanupController {
    private final RoomService roomService;
    private final FriendService friendService;
    private final LeaderboardService leaderboardService;
    private final MatchmakingService matchmakingService;

    public AdminCleanupController(RoomService roomService, FriendService friendService,
                                  LeaderboardService leaderboardService, MatchmakingService matchmakingService) {
        this.roomService = roomService;
        this.friendService = friendService;
        this.leaderboardService = leaderboardService;
        this.matchmakingService = matchmakingService;
    }

    @PostMapping("/rooms")
    public ApiResponse<Map<String, Object>> rooms(@RequestBody CleanupRequest request) {
        ensureConfirmed(request);
        Map<String, Object> result = new HashMap<>(roomService.clearRoomData());
        result.put("queues", matchmakingService.clearQueueData());
        return ApiResponse.ok(result);
    }

    @PostMapping("/friends")
    public ApiResponse<Map<String, Object>> friends(@RequestBody CleanupRequest request) {
        ensureConfirmed(request);
        return ApiResponse.ok(friendService.clearFriendData());
    }

    @PostMapping("/leaderboard")
    public ApiResponse<Map<String, Object>> leaderboard(@RequestBody CleanupRequest request) {
        ensureConfirmed(request);
        return ApiResponse.ok(leaderboardService.clearData());
    }

    @PostMapping("/all")
    public ApiResponse<Map<String, Object>> all(@RequestBody CleanupRequest request) {
        ensureConfirmed(request);
        Map<String, Object> result = new HashMap<>();
        result.put("rooms", roomService.clearRoomData());
        result.put("queues", matchmakingService.clearQueueData());
        result.put("friends", friendService.clearFriendData());
        result.put("leaderboard", leaderboardService.clearData());
        return ApiResponse.ok(result);
    }

    private static void ensureConfirmed(CleanupRequest request) {
        if (request == null || !"CLEAR".equals(request.confirm())) {
            throw new BizException(ErrorCode.BAD_REQUEST, "清理数据需要 confirm=CLEAR");
        }
    }

    public record CleanupRequest(String confirm) {
    }
}
