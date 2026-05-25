package com.wildhunt.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class GameStateService {
    private final Map<Long, Object> matches = new ConcurrentHashMap<>();

    public Map<Long, Object> matches() {
        return matches;
    }
}
