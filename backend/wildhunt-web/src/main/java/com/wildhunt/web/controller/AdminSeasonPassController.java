package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.service.SeasonPassService;
import com.wildhunt.service.dto.SeasonPassConfig;
import com.wildhunt.service.dto.SeasonPassStatus;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/season-pass")
public class AdminSeasonPassController {
    private final SeasonPassService seasonPassService;

    public AdminSeasonPassController(SeasonPassService seasonPassService) {
        this.seasonPassService = seasonPassService;
    }

    @GetMapping("/config")
    public ApiResponse<SeasonPassConfig> config() {
        return ApiResponse.ok(seasonPassService.config());
    }

    @PutMapping("/config")
    public ApiResponse<SeasonPassConfig> updateConfig(@RequestBody SeasonPassConfig request) {
        return ApiResponse.ok(seasonPassService.updateConfig(request));
    }

    @GetMapping("/users/{userId}")
    public ApiResponse<SeasonPassStatus> userStatus(@PathVariable("userId") Long userId) {
        return ApiResponse.ok(seasonPassService.status(userId));
    }

    @PostMapping("/users/{userId}/exp")
    public ApiResponse<Map<String, Object>> grantExp(@PathVariable("userId") Long userId,
                                                     @RequestBody GrantExpRequest request) {
        return ApiResponse.ok(seasonPassService.adminGrantExp(userId, request == null ? 0 : request.exp(),
                request == null ? "admin" : request.reason()));
    }

    @PostMapping("/users/{userId}/premium")
    public ApiResponse<SeasonPassStatus> unlockPremium(@PathVariable("userId") Long userId) {
        return ApiResponse.ok(seasonPassService.unlockPremium(userId));
    }

    @PostMapping("/users/{userId}/reset")
    public ApiResponse<Map<String, Object>> reset(@PathVariable("userId") Long userId,
                                                  @RequestBody ConfirmRequest request) {
        ensureConfirmed(request);
        return ApiResponse.ok(seasonPassService.resetUser(userId));
    }

    private static void ensureConfirmed(ConfirmRequest request) {
        if (request == null || !"CLEAR".equals(request.confirm())) {
            throw new BizException(ErrorCode.BAD_REQUEST, "season pass management requires confirm=CLEAR");
        }
    }

    public record GrantExpRequest(int exp, String reason) {
    }

    public record ConfirmRequest(String confirm) {
    }
}
