package com.wildhunt.service;

import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.service.dto.AuthSession;
import com.wildhunt.service.dto.UserProfile;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserService userService;
    private final JwtService jwtService;
    private final RateLimitService rateLimitService;

    public AuthService(UserService userService, JwtService jwtService) {
        this(userService, jwtService, new RateLimitService());
    }

    @Autowired
    public AuthService(UserService userService, JwtService jwtService, RateLimitService rateLimitService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.rateLimitService = rateLimitService;
    }

    public AuthSession guestLogin() {
        rateLimitService.check("auth:guest", 20, Duration.ofMinutes(1), "登录太频繁");
        UserProfile user = userService.createGuestUser();
        return new AuthSession(jwtService.issue(user.userId()), user);
    }

    public AuthSession login(String username, String password) {
        rateLimitService.check("auth:login:" + (username == null ? "" : username.toLowerCase()), 5, Duration.ofMinutes(1),
                "登录失败次数过多，请稍后再试");
        UserProfile user = userService.login(username, password);
        return new AuthSession(jwtService.issue(user.userId()), user);
    }

    public AuthSession register(String username, String password, String nickname) {
        rateLimitService.check("auth:register:" + (username == null ? "" : username.toLowerCase()), 3, Duration.ofMinutes(1),
                "注册太频繁，请稍后再试");
        UserProfile user = userService.register(username, password, nickname);
        return new AuthSession(jwtService.issue(user.userId()), user);
    }

    public AuthSession bindAccount(String authorization, String username, String password, String nickname) {
        Long userId = jwtService.parseUserId(authorization);
        if (userId == null) throw new BizException(ErrorCode.UNAUTHORIZED, "请重新登录");
        UserProfile user = userService.bindGuestToAccount(userId, username, password, nickname);
        return new AuthSession(jwtService.issue(user.userId()), user);
    }

    public UserProfile me(String authorization) {
        Long userId = jwtService.parseUserId(authorization);
        if (userId == null) throw new BizException(ErrorCode.UNAUTHORIZED, "请重新登录");
        UserProfile user = userService.get(userId);
        if (user == null) throw new BizException(ErrorCode.UNAUTHORIZED, "会话已失效，请重新登录");
        return user;
    }
}
