package com.wildhunt.service;

import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import java.util.List;

final class ContentGuard {
    private static final List<String> BANNED_WORDS = List.of(
            "token", "password", "api_key", "apikey",
            "\u50bb", "\u6b7b\u5988", "\u8279", "\u64cd"
    );

    private ContentGuard() {
    }

    static String cleanDisplayText(String value, String fallback, int maxLength) {
        String clean = value == null ? "" : value.trim();
        if (clean.isBlank()) return fallback;
        if (clean.length() > maxLength) {
            throw new BizException(ErrorCode.BAD_REQUEST, "\u5185\u5bb9\u8fc7\u957f");
        }
        for (String word : BANNED_WORDS) {
            clean = clean.replaceAll("(?i)" + java.util.regex.Pattern.quote(word), "***");
        }
        return clean;
    }
}
