package com.wildhunt.service.event;

public record RoomRealtimeEvent(
        String type,
        Long roomId,
        Object message,
        Long targetUserId
) {
    public static RoomRealtimeEvent broadcast(String type, Long roomId, Object message) {
        return new RoomRealtimeEvent(type, roomId, message, null);
    }

    public static RoomRealtimeEvent targeted(String type, Long roomId, Object message, Long targetUserId) {
        return new RoomRealtimeEvent(type, roomId, message, targetUserId);
    }
}
