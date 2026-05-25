package com.wildhunt.service;

import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class RateLimitService {
    private final Map<String, Deque<Instant>> buckets = new ConcurrentHashMap<>();

    public void check(String key, int maxEvents, Duration window, String message) {
        Instant now = Instant.now();
        Deque<Instant> bucket = buckets.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        synchronized (bucket) {
            while (!bucket.isEmpty() && Duration.between(bucket.peekFirst(), now).compareTo(window) > 0) {
                bucket.removeFirst();
            }
            if (bucket.size() >= maxEvents) {
                throw new BizException(ErrorCode.BAD_REQUEST, message);
            }
            bucket.addLast(now);
        }
    }
}
