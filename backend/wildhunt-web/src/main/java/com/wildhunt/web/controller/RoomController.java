package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.RoomChatService;
import com.wildhunt.service.RoomService;
import com.wildhunt.service.dto.RoomChatMessageDto;
import com.wildhunt.service.dto.RoomSnapshot;
import com.wildhunt.service.dto.StartGameResult;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomService roomService;
    private final RoomChatService roomChatService;
    private final JwtService jwtService;

    public RoomController(RoomService roomService, RoomChatService roomChatService, JwtService jwtService) {
        this.roomService = roomService;
        this.roomChatService = roomChatService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public ApiResponse<List<RoomSnapshot>> list() {
        return ApiResponse.ok(roomService.listPublicRooms());
    }

    @GetMapping("/current")
    public ApiResponse<RoomSnapshot> current(HttpServletRequest request) {
        return ApiResponse.ok(roomService.currentRoom(userId(request)));
    }

    @PostMapping
    public ApiResponse<RoomSnapshot> create(HttpServletRequest request, @Valid @RequestBody CreateRoomRequest body) {
        return ApiResponse.ok(roomService.createRoom(userId(request), body.name(), body.maxPlayers(), body.aiDeerCount(), body.publicRoom()));
    }

    @PostMapping("/{roomId}/join")
    public ApiResponse<RoomSnapshot> join(HttpServletRequest request, @PathVariable("roomId") Long roomId) {
        return ApiResponse.ok(roomService.join(userId(request), roomId));
    }

    @PostMapping("/join-by-code/{code}")
    public ApiResponse<RoomSnapshot> joinByCode(HttpServletRequest request, @PathVariable("code") String code) {
        return ApiResponse.ok(roomService.joinByCode(userId(request), code));
    }

    @PostMapping("/{roomId}/ready")
    public ApiResponse<RoomSnapshot> ready(HttpServletRequest request, @PathVariable("roomId") Long roomId, @RequestBody ReadyRequest body) {
        return ApiResponse.ok(roomService.ready(userId(request), roomId, body.ready()));
    }

    @PostMapping("/{roomId}/start")
    public ApiResponse<StartGameResult> start(HttpServletRequest request, @PathVariable("roomId") Long roomId) {
        return ApiResponse.ok(roomService.start(userId(request), roomId));
    }

    @PostMapping("/{roomId}/leave")
    public ApiResponse<RoomSnapshot> leave(HttpServletRequest request, @PathVariable("roomId") Long roomId) {
        return ApiResponse.ok(roomService.leave(userId(request), roomId));
    }

    @PostMapping("/{roomId}/kick")
    public ApiResponse<RoomSnapshot> kick(HttpServletRequest request, @PathVariable("roomId") Long roomId, @RequestBody KickRequest body) {
        return ApiResponse.ok(roomService.kick(userId(request), roomId, body.targetUserId(), body.reason()));
    }

    @GetMapping("/{roomId}/chat")
    public ApiResponse<List<RoomChatMessageDto>> chatHistory(
            HttpServletRequest request,
            @PathVariable("roomId") Long roomId,
            @RequestParam(value = "limit", defaultValue = "30") int limit) {
        return ApiResponse.ok(roomChatService.history(userId(request), roomId, limit));
    }

    @PostMapping("/{roomId}/chat")
    public ApiResponse<RoomChatMessageDto> sendChat(HttpServletRequest request, @PathVariable("roomId") Long roomId, @RequestBody ChatRequest body) {
        return ApiResponse.ok(roomChatService.sendMessage(userId(request), roomId, body.content()));
    }

    private Long userId(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return userId == null ? 0L : userId;
    }

    public record CreateRoomRequest(@NotBlank String name, @Min(2) @Max(10) int maxPlayers, @Min(0) int aiDeerCount, boolean publicRoom) {
    }

    public record ReadyRequest(boolean ready) {
    }

    public record KickRequest(Long targetUserId, String reason) {
    }

    public record ChatRequest(@NotBlank String content) {
    }
}
