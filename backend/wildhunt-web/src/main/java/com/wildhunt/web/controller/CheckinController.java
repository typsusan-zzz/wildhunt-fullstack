package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.service.CheckinService;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.dto.CheckinStatus;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkin")
public class CheckinController {
    private final CheckinService checkinService;
    private final JwtService jwtService;

    public CheckinController(CheckinService checkinService, JwtService jwtService) {
        this.checkinService = checkinService;
        this.jwtService = jwtService;
    }

    @GetMapping("/status")
    public ApiResponse<CheckinStatus> status(HttpServletRequest request) {
        return ApiResponse.ok(checkinService.status(userId(request)));
    }

    @PostMapping("/claim")
    public ApiResponse<CheckinStatus> claim(HttpServletRequest request) {
        return ApiResponse.ok(checkinService.claim(userId(request)));
    }

    @GetMapping("/history")
    public ApiResponse<List<CheckinStatus.RewardPreview>> history(HttpServletRequest request) {
        return ApiResponse.ok(checkinService.history(userId(request)));
    }

    private Long userId(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return userId == null ? 0L : userId;
    }
}
