package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.common.enums.QueueType;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.MatchmakingService;
import com.wildhunt.service.dto.MatchmakingResult;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matchmaking")
public class MatchmakingController {
    private final MatchmakingService matchmakingService;
    private final JwtService jwtService;

    public MatchmakingController(MatchmakingService matchmakingService, JwtService jwtService) {
        this.matchmakingService = matchmakingService;
        this.jwtService = jwtService;
    }

    @PostMapping("/queue")
    public ApiResponse<MatchmakingResult> queue(HttpServletRequest request, @RequestBody QueueRequest body) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return ApiResponse.ok(matchmakingService.enqueue(userId == null ? 0L : userId, body.queueType()));
    }

    @GetMapping("/status")
    public ApiResponse<MatchmakingResult> status(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return ApiResponse.ok(matchmakingService.status(userId == null ? 0L : userId));
    }

    @PostMapping("/cancel")
    public ApiResponse<Void> cancel(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        matchmakingService.cancel(userId == null ? 0L : userId);
        return ApiResponse.ok(null);
    }

    public record QueueRequest(QueueType queueType) {
    }
}
