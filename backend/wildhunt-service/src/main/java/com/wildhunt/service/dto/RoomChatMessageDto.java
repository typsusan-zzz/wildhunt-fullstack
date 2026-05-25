package com.wildhunt.service.dto;

import java.time.LocalDateTime;

public record RoomChatMessageDto(
        Long id,
        Long roomId,
        Long userId,
        String nickname,
        String messageType,
        String content,
        LocalDateTime createdAt
) {
}
