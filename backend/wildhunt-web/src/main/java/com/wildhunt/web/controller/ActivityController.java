package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.service.ActivityService;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.dto.ActivityDto;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {
    private final ActivityService activityService;
    private final JwtService jwtService;

    public ActivityController(ActivityService activityService, JwtService jwtService) {
        this.activityService = activityService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public ApiResponse<List<ActivityDto>> list(HttpServletRequest request) {
        return ApiResponse.ok(activityService.list(userId(request)));
    }

    @GetMapping("/my-progress")
    public ApiResponse<List<ActivityDto>> progress(HttpServletRequest request) {
        return ApiResponse.ok(activityService.progress(userId(request)));
    }

    @PostMapping("/{activityId}/claim")
    public ApiResponse<ActivityDto> claim(HttpServletRequest request, @PathVariable("activityId") Long activityId) {
        return ApiResponse.ok(activityService.claim(userId(request), activityId));
    }

    private Long userId(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return userId == null ? 0L : userId;
    }
}
