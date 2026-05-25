package com.wildhunt.service;

import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class MockWechatAuthClient implements WechatAuthClient {
    @Override
    public Map<String, Object> exchangeCode(String code) {
        return Map.of("provider", "WECHAT", "openId", "mock-open-id-" + code, "mock", true);
    }
}
