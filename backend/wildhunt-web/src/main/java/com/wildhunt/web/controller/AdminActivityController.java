package com.wildhunt.web.controller;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.service.ActivityService;
import com.wildhunt.service.dto.ActivityAdminRequest;
import com.wildhunt.service.dto.ActivityDto;
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
@RequestMapping("/api/admin/activities")
public class AdminActivityController {
    private final ActivityService activityService;

    public AdminActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping
    public ApiResponse<List<ActivityDto>> list() {
        return ApiResponse.ok(activityService.adminList());
    }

    @PostMapping
    public ApiResponse<ActivityDto> create(@RequestBody ActivityAdminRequest request) {
        return ApiResponse.ok(activityService.create(request));
    }

    @PutMapping("/{activityId}")
    public ApiResponse<ActivityDto> update(@PathVariable("activityId") Long activityId,
                                           @RequestBody ActivityAdminRequest request) {
        return ApiResponse.ok(activityService.update(activityId, request));
    }

    @PostMapping("/{activityId}/disable")
    public ApiResponse<ActivityDto> disable(@PathVariable("activityId") Long activityId) {
        return ApiResponse.ok(activityService.disable(activityId));
    }

    @PostMapping("/claims/reset")
    public ApiResponse<Map<String, Object>> resetClaims(@RequestParam(value = "userId", required = false) Long userId,
                                                        @RequestBody ConfirmRequest request) {
        ensureConfirmed(request);
        return ApiResponse.ok(activityService.resetClaims(userId));
    }

    private static void ensureConfirmed(ConfirmRequest request) {
        if (request == null || !"CLEAR".equals(request.confirm())) {
            throw new BizException(ErrorCode.BAD_REQUEST, "activity management requires confirm=CLEAR");
        }
    }

    public record ConfirmRequest(String confirm) {
    }
}
