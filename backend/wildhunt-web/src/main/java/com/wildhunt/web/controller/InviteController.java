package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.service.InviteService;
import com.wildhunt.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invites")
public class InviteController {
    private final InviteService inviteService;
    private final JwtService jwtService;

    public InviteController(InviteService inviteService, JwtService jwtService) {
        this.inviteService = inviteService;
        this.jwtService = jwtService;
    }

    @PostMapping("/friend")
    public ApiResponse<Map<String, String>> friend(HttpServletRequest request, @RequestBody InviteRequest body) {
        return ApiResponse.ok(inviteService.inviteFriend(userId(request), body.roomId(), body.friendUserId()));
    }

    @PostMapping("/wechat")
    public ApiResponse<Map<String, String>> wechat(HttpServletRequest request, @RequestBody InviteRequest body) {
        return ApiResponse.ok(inviteService.wechatInvite(userId(request), body.roomId()));
    }

    @PostMapping("/{inviteCode}/accept")
    public ApiResponse<Map<String, Object>> accept(HttpServletRequest request, @PathVariable("inviteCode") String inviteCode) {
        return ApiResponse.ok(inviteService.accept(userId(request), inviteCode));
    }

    @PostMapping("/{inviteCode}/reject")
    public ApiResponse<Map<String, String>> reject(@PathVariable("inviteCode") String inviteCode) {
        return ApiResponse.ok(inviteService.reject(inviteCode));
    }

    private Long userId(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return userId == null ? 0L : userId;
    }

    public record InviteRequest(Long roomId, Long friendUserId) {
    }
}
