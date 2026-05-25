package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.service.JwtService;
import com.wildhunt.service.UserAssetService;
import com.wildhunt.service.UserService;
import com.wildhunt.service.dto.UserAssetDto;
import com.wildhunt.service.dto.UserProfile;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final UserAssetService userAssetService;
    private final JwtService jwtService;

    public UserController(UserService userService, UserAssetService userAssetService, JwtService jwtService) {
        this.userService = userService;
        this.userAssetService = userAssetService;
        this.jwtService = jwtService;
    }

    @GetMapping("/me/profile")
    public ApiResponse<UserProfile> me(HttpServletRequest request) {
        return ApiResponse.ok(userService.getOrCreate(userId(request)));
    }

    @PutMapping("/me/profile")
    public ApiResponse<UserProfile> update(HttpServletRequest request, @RequestBody ProfileRequest body) {
        return ApiResponse.ok(userService.updateProfile(userId(request), body.nickname(), body.avatarUrl()));
    }

    @PostMapping("/me/guide-seen")
    public ApiResponse<UserProfile> guideSeen(HttpServletRequest request) {
        return ApiResponse.ok(userService.markGuideSeen(userId(request)));
    }

    @GetMapping("/me/assets")
    public ApiResponse<List<UserAssetDto>> assets(HttpServletRequest request) {
        return ApiResponse.ok(userAssetService.list(userId(request)));
    }

    @PostMapping("/me/assets/equip")
    public ApiResponse<UserAssetDto> equip(HttpServletRequest request, @RequestBody AssetRequest body) {
        return ApiResponse.ok(userAssetService.equip(userId(request), body.assetType(), body.assetCode()));
    }

    @GetMapping("/{userId}/profile")
    public ApiResponse<UserProfile> profile(@PathVariable("userId") Long userId) {
        return ApiResponse.ok(userService.getOrCreate(userId));
    }

    private Long userId(HttpServletRequest request) {
        Long userId = jwtService.parseUserId(request.getHeader("Authorization"));
        return userId == null ? 0L : userId;
    }

    public record ProfileRequest(String nickname, String avatarUrl) {
    }

    public record AssetRequest(String assetType, String assetCode) {
    }
}
