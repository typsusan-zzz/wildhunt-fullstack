package com.wildhunt.web.config;

import com.wildhunt.common.api.ApiResponse;
import com.wildhunt.common.exception.BizException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BizException.class)
    ApiResponse<Void> biz(BizException ex) {
        return ApiResponse.error(ex.code().name(), ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    ApiResponse<Void> fallback(Exception ex) {
        return ApiResponse.error("INTERNAL_ERROR", ex.getMessage());
    }
}
