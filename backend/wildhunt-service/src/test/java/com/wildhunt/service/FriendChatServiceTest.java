package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.wildhunt.service.event.FriendChatRealtimeEvent;
import com.wildhunt.dal.mapper.FriendChatMessageMapper;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class FriendChatServiceTest {
    @Test
    void sendsFriendMessageAndPublishesRealtimeEvent() {
        UserService userService = new UserService();
        PlayerPresenceService presenceService = new PlayerPresenceService(event -> {
        });
        FriendService friendService = new FriendService(userService, new RateLimitService(), presenceService);
        List<FriendChatRealtimeEvent> events = new ArrayList<>();
        FriendChatService chatService = new FriendChatService(userService, friendService, presenceService, (FriendChatMessageMapper) null, event -> {
            if (event instanceof FriendChatRealtimeEvent chatEvent) events.add(chatEvent);
        });
        var sender = userService.createGuestUser();
        var receiver = userService.createGuestUser();
        friendService.requestFriend(sender.userId(), receiver.username());
        friendService.acceptFriendRequest(receiver.userId(), sender.userId());

        var sent = chatService.sendMessage(sender.userId(), receiver.userId(), " hello ");
        var receiverHistory = chatService.history(receiver.userId(), sender.userId(), 20);

        assertEquals("hello", sent.content());
        assertEquals(sender.userId(), receiverHistory.get(0).peerUserId());
        assertEquals(receiver.userId(), events.get(0).targetUserId());
        assertEquals("FRIEND_CHAT_MESSAGE", events.get(0).type());
    }

    @Test
    void conversationsShowUnreadAndMarkReadClearsIt() {
        UserService userService = new UserService();
        PlayerPresenceService presenceService = new PlayerPresenceService(event -> {
        });
        FriendService friendService = new FriendService(userService, new RateLimitService(), presenceService);
        FriendChatService chatService = new FriendChatService(userService, friendService, presenceService);
        var sender = userService.createGuestUser();
        var receiver = userService.createGuestUser();
        friendService.requestFriend(sender.userId(), receiver.username());
        friendService.acceptFriendRequest(receiver.userId(), sender.userId());

        chatService.sendMessage(sender.userId(), receiver.userId(), "ping");

        assertEquals(1, chatService.conversations(receiver.userId()).get(0).unreadCount());
        chatService.markRead(receiver.userId(), sender.userId());
        assertEquals(0, chatService.conversations(receiver.userId()).get(0).unreadCount());
    }
}
