package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.enums.RoleType;
import com.wildhunt.common.enums.RoomStatus;
import com.wildhunt.service.event.RoomRealtimeEvent;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

class RoomServiceTest {
    @Test
    void ownerTransfersAndLastLeaveClosesRoom() {
        UserService userService = new UserService();
        List<RoomRealtimeEvent> events = new ArrayList<>();
        RoomService roomService = roomService(userService, event -> {
            if (event instanceof RoomRealtimeEvent roomEvent) events.add(roomEvent);
        });
        long owner = userService.createGuestUser().userId();
        long guest = userService.createGuestUser().userId();

        var room = roomService.createRoom(owner, "测试房", 10, 16, true);
        room = roomService.join(guest, room.id());
        room = roomService.leave(owner, room.id());

        assertEquals(guest, room.ownerUserId());
        assertTrue(room.members().stream().anyMatch(member -> member.userId().equals(guest) && member.owner()));

        room = roomService.leave(guest, room.id());
        assertEquals(RoomStatus.CLOSED, room.status());
        assertTrue(events.stream().anyMatch(event -> "ROOM_SNAPSHOT".equals(event.type())));
    }

    @Test
    void startCreatesMatchAndAssignsSingleWolf() {
        UserService userService = new UserService();
        RoomService roomService = roomService(userService, event -> {});
        long owner = userService.createGuestUser().userId();
        long guest = userService.createGuestUser().userId();

        var room = roomService.createRoom(owner, "开局房", 10, 16, true);
        roomService.join(guest, room.id());
        roomService.ready(guest, room.id(), true);
        var result = roomService.start(owner, room.id());
        var started = roomService.getRoom(room.id());

        assertNotNull(result.matchId());
        assertEquals(RoomStatus.PLAYING, started.status());
        assertEquals(1, started.members().stream().filter(member -> member.roleType() == RoleType.WOLF).count());
    }

    @Test
    void startRequiresNonOwnerMembersReady() {
        UserService userService = new UserService();
        RoomService roomService = roomService(userService, event -> {});
        long owner = userService.createGuestUser().userId();
        long guest = userService.createGuestUser().userId();

        var room = roomService.createRoom(owner, "准备房", 10, 16, true);
        roomService.join(guest, room.id());

        assertThrows(BizException.class, () -> roomService.start(owner, room.id()));
        assertEquals(RoomStatus.WAITING, roomService.getRoom(room.id()).status());
    }

    @Test
    void createRoomRejectsUserAlreadyInRoom() {
        UserService userService = new UserService();
        RoomService roomService = roomService(userService, event -> {});
        long owner = userService.createGuestUser().userId();

        roomService.createRoom(owner, "第一间", 10, 16, true);

        assertThrows(BizException.class, () -> roomService.createRoom(owner, "第二间", 10, 16, true));
    }

    @Test
    void currentRoomIgnoresSystemRoom() {
        UserService userService = new UserService();
        RoomService roomService = roomService(userService, event -> {});
        long userId = userService.createGuestUser().userId();

        roomService.createSystemRoom(userId, com.wildhunt.common.enums.QueueType.WOLF);

        assertNull(roomService.currentRoom(userId));
        assertTrue(roomService.listPublicRooms().isEmpty());
    }

    private static RoomService roomService(UserService userService, ApplicationEventPublisher publisher) {
        return new RoomService(userService, new GameMatchService(userService), publisher);
    }
}
