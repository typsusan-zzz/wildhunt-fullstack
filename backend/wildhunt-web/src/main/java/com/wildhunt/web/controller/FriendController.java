package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.service.FriendService;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.RoomService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/friends")
public class FriendController {
    private final FriendService friendService;
    private final RoomService roomService;
    private final JwtService jwtService;

    public FriendController(FriendService friendService, RoomService roomService, JwtService jwtService) {
        this.friendService = friendService;
        this.roomService = roomService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(HttpServletRequest request) {
        return ApiResponse.ok(friendService.listFriends(userId(request)));
    }

    @GetMapping("/search")
    public ApiResponse<List<Map<String, Object>>> search(HttpServletRequest request, @RequestParam("keyword") String keyword) {
        return ApiResponse.ok(friendService.searchUsers(userId(request), keyword));
    }

    @GetMapping("/requests")
    public ApiResponse<Map<String, List<Map<String, Object>>>> requests(HttpServletRequest request) {
        return ApiResponse.ok(friendService.pendingRequests(userId(request)));
    }

    @PostMapping("/requests")
    public ApiResponse<Map<String, Object>> request(HttpServletRequest request, @RequestBody FriendRequest body) {
        return ApiResponse.ok(friendService.requestFriend(userId(request), body.username()));
    }

    @PostMapping("/requests/{requesterUserId}/accept")
    public ApiResponse<Map<String, Object>> accept(HttpServletRequest request, @PathVariable("requesterUserId") Long requesterUserId) {
        return ApiResponse.ok(friendService.acceptFriendRequest(userId(request), requesterUserId));
    }

    @PostMapping("/requests/{requesterUserId}/reject")
    public ApiResponse<Map<String, Object>> reject(HttpServletRequest request, @PathVariable("requesterUserId") Long requesterUserId) {
        return ApiResponse.ok(friendService.rejectFriendRequest(userId(request), requesterUserId));
    }

    @PostMapping("/room-requests")
    public ApiResponse<Map<String, Object>> requestFromRoom(HttpServletRequest request, @RequestBody FriendRequest body) {
        Long userId = userId(request);
        if (!roomService.isActiveMember(userId, body.roomId()) || !roomService.isActiveMember(body.targetUserId(), body.roomId())) {
            throw new com.wildhunt.common.exception.BizException(com.wildhunt.common.exception.ErrorCode.NOT_ROOM_MEMBER, "双方必须在同一个房间内");
        }
        return ApiResponse.ok(friendService.requestFriendByUserId(userId, body.targetUserId(), "ROOM"));
    }

    private Long userId(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return userId == null ? 0L : userId;
    }

    public record FriendRequest(String username, Long targetUserId, Long roomId) {
    }
}
