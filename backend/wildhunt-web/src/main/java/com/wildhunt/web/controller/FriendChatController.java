package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.service.FriendChatService;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.dto.FriendChatMessageDto;
import com.wildhunt.service.dto.FriendConversationDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chats/friends")
public class FriendChatController {
    private final FriendChatService friendChatService;
    private final JwtService jwtService;

    public FriendChatController(FriendChatService friendChatService, JwtService jwtService) {
        this.friendChatService = friendChatService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public ApiResponse<List<FriendConversationDto>> conversations(HttpServletRequest request) {
        return ApiResponse.ok(friendChatService.conversations(userId(request)));
    }

    @GetMapping("/{friendUserId}")
    public ApiResponse<List<FriendChatMessageDto>> history(
            HttpServletRequest request,
            @PathVariable("friendUserId") Long friendUserId,
            @RequestParam(value = "limit", defaultValue = "50") int limit) {
        return ApiResponse.ok(friendChatService.history(userId(request), friendUserId, limit));
    }

    @PostMapping("/{friendUserId}")
    public ApiResponse<FriendChatMessageDto> send(
            HttpServletRequest request,
            @PathVariable("friendUserId") Long friendUserId,
            @RequestBody ChatRequest body) {
        return ApiResponse.ok(friendChatService.sendMessage(userId(request), friendUserId, body.content()));
    }

    @PostMapping("/{friendUserId}/read")
    public ApiResponse<Map<String, Integer>> read(HttpServletRequest request, @PathVariable("friendUserId") Long friendUserId) {
        return ApiResponse.ok(friendChatService.markRead(userId(request), friendUserId));
    }

    private Long userId(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return userId == null ? 0L : userId;
    }

    public record ChatRequest(@NotBlank String content) {
    }
}
