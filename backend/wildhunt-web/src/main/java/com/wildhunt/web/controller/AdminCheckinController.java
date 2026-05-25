package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.service.CheckinService;
import com.wildhunt.service.dto.CheckinAdminRecord;
import com.wildhunt.service.dto.CheckinConfig;
import com.wildhunt.service.dto.CheckinStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/checkin")
public class AdminCheckinController {
    private final CheckinService checkinService;

    public AdminCheckinController(CheckinService checkinService) {
        this.checkinService = checkinService;
    }

    @GetMapping("/config")
    public ApiResponse<CheckinConfig> config() {
        return ApiResponse.ok(checkinService.config());
    }

    @PutMapping("/config")
    public ApiResponse<CheckinConfig> updateConfig(@RequestBody CheckinConfigRequest request) {
        return ApiResponse.ok(checkinService.updateConfig(request == null ? null : request.rewards()));
    }

    @GetMapping("/users/{userId}/status")
    public ApiResponse<CheckinStatus> userStatus(@PathVariable("userId") Long userId) {
        return ApiResponse.ok(checkinService.status(userId));
    }

    @GetMapping("/users/{userId}/records")
    public ApiResponse<List<CheckinAdminRecord>> records(@PathVariable("userId") Long userId,
                                                         @RequestParam(value = "limit", defaultValue = "30") int limit) {
        return ApiResponse.ok(checkinService.adminRecords(userId, limit));
    }

    @PostMapping("/users/{userId}/grant")
    public ApiResponse<CheckinAdminRecord> grant(@PathVariable("userId") Long userId,
                                                 @RequestBody GrantCheckinRequest request) {
        GrantCheckinRequest body = request == null ? new GrantCheckinRequest(null, null, null, true) : request;
        return ApiResponse.ok(checkinService.adminGrant(userId, body.checkinDate(), body.streakDays(),
                body.rewardExp(), body.grantReward() == null || body.grantReward()));
    }

    @PostMapping("/users/{userId}/reset")
    public ApiResponse<Map<String, Object>> resetUser(@PathVariable("userId") Long userId,
                                                      @RequestBody ConfirmRequest request) {
        ensureConfirmed(request);
        return ApiResponse.ok(checkinService.resetUser(userId));
    }

    @PostMapping("/reset-all")
    public ApiResponse<Map<String, Object>> resetAll(@RequestBody ConfirmRequest request) {
        ensureConfirmed(request);
        return ApiResponse.ok(checkinService.resetAll());
    }

    private static void ensureConfirmed(ConfirmRequest request) {
        if (request == null || !"CLEAR".equals(request.confirm())) {
            throw new BizException(ErrorCode.BAD_REQUEST, "checkin management requires confirm=CLEAR");
        }
    }

    public record CheckinConfigRequest(List<Integer> rewards) {
    }

    public record GrantCheckinRequest(LocalDate checkinDate, Integer streakDays, Integer rewardExp, Boolean grantReward) {
    }

    public record ConfirmRequest(String confirm) {
    }
}
