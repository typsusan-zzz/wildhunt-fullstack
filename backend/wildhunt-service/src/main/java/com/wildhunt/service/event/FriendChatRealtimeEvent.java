package com.wildhunt.service.event;

public record FriendChatRealtimeEvent(
        Long targetUserId,
        String type,
        Object message
) {
}
