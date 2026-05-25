package com.wildhunt.service.dto;

public record AuthSession(String token, UserProfile user) {
}
