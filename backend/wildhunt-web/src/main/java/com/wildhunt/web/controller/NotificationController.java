package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.NotificationService;
import com.wildhunt.service.dto.NotificationDto;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    private final JwtService jwtService;

    public NotificationController(NotificationService notificationService, JwtService jwtService) {
        this.notificationService = notificationService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public ApiResponse<List<NotificationDto>> list(HttpServletRequest request) {
        return ApiResponse.ok(notificationService.list(userId(request)));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Integer>> unread(HttpServletRequest request) {
        return ApiResponse.ok(Map.of("count", notificationService.unreadCount(userId(request))));
    }

    @PostMapping("/{notificationId}/read")
    public ApiResponse<NotificationDto> read(HttpServletRequest request, @PathVariable("notificationId") Long notificationId) {
        return ApiResponse.ok(notificationService.markRead(userId(request), notificationId));
    }

    @PostMapping("/read-all")
    public ApiResponse<Void> readAll(HttpServletRequest request) {
        notificationService.markAllRead(userId(request));
        return ApiResponse.ok(null);
    }

    private Long userId(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return userId == null ? 0L : userId;
    }
}
