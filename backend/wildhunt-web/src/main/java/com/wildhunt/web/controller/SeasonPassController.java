package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.SeasonPassService;
import com.wildhunt.service.dto.SeasonPassStatus;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/season-pass")
public class SeasonPassController {
    private final SeasonPassService seasonPassService;
    private final JwtService jwtService;

    public SeasonPassController(SeasonPassService seasonPassService, JwtService jwtService) {
        this.seasonPassService = seasonPassService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public ApiResponse<SeasonPassStatus> status(HttpServletRequest request) {
        return ApiResponse.ok(seasonPassService.status(userId(request)));
    }

    @PostMapping("/rewards/{track}/{level}/claim")
    public ApiResponse<SeasonPassStatus> claim(HttpServletRequest request, @PathVariable("track") String track,
                                               @PathVariable("level") int level) {
        return ApiResponse.ok(seasonPassService.claimReward(userId(request), track, level));
    }

    @PostMapping("/premium/unlock")
    public ApiResponse<SeasonPassStatus> unlockPremium(HttpServletRequest request) {
        return ApiResponse.ok(seasonPassService.unlockPremium(userId(request)));
    }

    private Long userId(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return userId == null ? 0L : userId;
    }
}
