package com.wildhunt.service;

import java.util.Map;

public interface WechatAuthClient {
    Map<String, Object> exchangeCode(String code);
}
