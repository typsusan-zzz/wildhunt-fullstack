package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.service.LeaderboardService;
import com.wildhunt.service.dto.LeaderboardEntryDto;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {
    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping("/top")
    public ApiResponse<List<LeaderboardEntryDto>> top(
            @RequestParam(name = "type", defaultValue = "RATING") String type,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        return ApiResponse.ok(leaderboardService.top(type, limit));
    }
}
