package com.wildhunt.service;

import com.wildhunt.common.util.Signatures;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final String secret = System.getenv().getOrDefault("WILDHUNT_JWT_SECRET", "wildhunt-local-dev-secret");

    public String issue(Long userId) {
        String header = base64("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
        long exp = Instant.now().plusSeconds(86400 * 30).getEpochSecond();
        String payload = base64("{\"sub\":\"" + userId + "\",\"exp\":" + exp + "}");
        String body = header + "." + payload;
        return body + "." + Signatures.hmacSha256Base64Url(body, secret);
    }

    public Long parseUserId(String token) {
        if (token == null || token.isBlank()) return null;
        String[] parts = token.replace("Bearer ", "").split("\\.");
        if (parts.length != 3) return null;
        String expected = Signatures.hmacSha256Base64Url(parts[0] + "." + parts[1], secret);
        if (!expected.equals(parts[2])) return null;
        String json = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        Long exp = parseLong(json, "\"exp\":");
        if (exp != null && exp < Instant.now().getEpochSecond()) return null;
        int start = json.indexOf("\"sub\":\"");
        if (start < 0) return null;
        int valueStart = start + 7;
        int valueEnd = json.indexOf('"', valueStart);
        return Long.parseLong(json.substring(valueStart, valueEnd));
    }

    private static String base64(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static Long parseLong(String json, String key) {
        int start = json.indexOf(key);
        if (start < 0) return null;
        int valueStart = start + key.length();
        int valueEnd = valueStart;
        while (valueEnd < json.length() && Character.isDigit(json.charAt(valueEnd))) {
            valueEnd++;
        }
        if (valueEnd == valueStart) return null;
        return Long.parseLong(json.substring(valueStart, valueEnd));
    }
}
