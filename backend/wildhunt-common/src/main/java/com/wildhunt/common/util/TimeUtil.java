package com.wildhunt.common.util;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

public final class TimeUtil {
    private TimeUtil() {
    }

    public static OffsetDateTime nowUtc() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }
}
