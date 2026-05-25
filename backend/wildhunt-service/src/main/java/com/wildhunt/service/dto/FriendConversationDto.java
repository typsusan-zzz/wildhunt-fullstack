package com.wildhunt.service.dto;

import java.time.LocalDateTime;

public record FriendConversationDto(
        Long friendUserId,
        String nickname,
        String onlineState,
        boolean inGame,
        String lastMessage,
        LocalDateTime lastMessageAt,
        int unreadCount
) {
}
