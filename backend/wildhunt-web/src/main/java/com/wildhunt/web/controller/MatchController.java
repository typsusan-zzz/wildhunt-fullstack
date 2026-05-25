package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.service.GameMatchService;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.dto.MatchSnapshot;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matches")
public class MatchController {
    private final GameMatchService gameMatchService;
    private final JwtService jwtService;

    public MatchController(GameMatchService gameMatchService, JwtService jwtService) {
        this.gameMatchService = gameMatchService;
        this.jwtService = jwtService;
    }

    @GetMapping("/current")
    public ApiResponse<MatchSnapshot> current(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return ApiResponse.ok(userId == null ? null : gameMatchService.current(userId));
    }

    @PostMapping("/current/leave")
    public ApiResponse<MatchSnapshot> leaveCurrent(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return ApiResponse.ok(userId == null ? null : gameMatchService.leaveCurrent(userId));
    }
}
