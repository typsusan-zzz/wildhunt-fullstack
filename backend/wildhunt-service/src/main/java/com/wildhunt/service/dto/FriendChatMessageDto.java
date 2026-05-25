package com.wildhunt.service.dto;

import java.time.LocalDateTime;

public record FriendChatMessageDto(
        Long id,
        Long senderUserId,
        Long receiverUserId,
        Long peerUserId,
        String senderNickname,
        String receiverNickname,
        String content,
        boolean read,
        LocalDateTime createdAt
) {
}
