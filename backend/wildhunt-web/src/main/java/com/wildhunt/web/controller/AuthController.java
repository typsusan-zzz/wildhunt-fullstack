package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.service.AuthService;
import com.wildhunt.service.dto.AuthSession;
import com.wildhunt.service.dto.UserProfile;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/guest")
    public ApiResponse<AuthSession> guest() {
        return ApiResponse.ok(authService.guestLogin());
    }

    @PostMapping("/login")
    public ApiResponse<AuthSession> login(@Valid @RequestBody LoginRequest body) {
        return ApiResponse.ok(authService.login(body.username(), body.password()));
    }

    @PostMapping("/register")
    public ApiResponse<AuthSession> register(@Valid @RequestBody RegisterRequest body) {
        return ApiResponse.ok(authService.register(body.username(), body.password(), body.nickname()));
    }

    @PostMapping("/bind-account")
    public ApiResponse<AuthSession> bindAccount(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody RegisterRequest body) {
        return ApiResponse.ok(authService.bindAccount(authorization, body.username(), body.password(), body.nickname()));
    }

    @GetMapping("/me")
    public ApiResponse<UserProfile> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return ApiResponse.ok(authService.me(authorization));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        return ApiResponse.ok(null);
    }

    public record LoginRequest(@NotBlank String username, @NotBlank @Size(min = 6, max = 72) String password) {
    }

    public record RegisterRequest(@NotBlank String username, @NotBlank @Size(min = 6, max = 72) String password, String nickname) {
    }
}
