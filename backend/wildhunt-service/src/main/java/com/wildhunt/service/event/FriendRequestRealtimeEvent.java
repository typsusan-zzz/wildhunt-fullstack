package com.wildhunt.service.event;

public record FriendRequestRealtimeEvent(
        Long targetUserId,
        String type,
        Object message
) {
}
