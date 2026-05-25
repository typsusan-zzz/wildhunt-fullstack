package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.wildhunt.service.event.FriendRequestRealtimeEvent;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class FriendServiceTest {
    @Test
    void friendListReflectsPresenceState() {
        UserService userService = new UserService();
        PlayerPresenceService presenceService = new PlayerPresenceService(event -> {
        });
        FriendService friendService = new FriendService(userService, new RateLimitService(), presenceService);
        long userId = userService.createGuestUser().userId();
        var friend = userService.createGuestUser();

        friendService.requestFriend(userId, friend.username());
        friendService.acceptFriendRequest(friend.userId(), userId);
        presenceService.setMatching(friend.userId());

        var friends = friendService.listFriends(userId);

        assertEquals(friend.userId(), friends.get(0).get("userId"));
        assertEquals("MATCHING", friends.get(0).get("onlineState"));
    }

    @Test
    void presenceWatchersIncludeAcceptedFriendsOnly() {
        UserService userService = new UserService();
        FriendService friendService = new FriendService(userService);
        long userId = userService.createGuestUser().userId();
        var friend = userService.createGuestUser();
        var fallbackViewer = userService.createGuestUser();

        friendService.requestFriend(userId, friend.username());
        friendService.acceptFriendRequest(friend.userId(), userId);

        var watchers = friendService.watchersOf(friend.userId());

        assertTrue(watchers.contains(userId));
        assertTrue(!watchers.contains(fallbackViewer.userId()));
    }

    @Test
    void requestStaysPendingUntilAccepted() {
        UserService userService = new UserService();
        FriendService friendService = new FriendService(userService);
        var requester = userService.createGuestUser();
        var receiver = userService.createGuestUser();

        var pending = friendService.requestFriend(requester.userId(), receiver.username());
        var receiverRequests = friendService.pendingRequests(receiver.userId());

        assertEquals("PENDING", pending.get("status"));
        assertEquals(1, receiverRequests.get("received").size());
        assertEquals(0, friendService.listFriends(requester.userId()).size());

        friendService.acceptFriendRequest(receiver.userId(), requester.userId());

        assertEquals(1, friendService.listFriends(requester.userId()).size());
    }

    @Test
    void friendRequestPublishesLobbyEvent() {
        UserService userService = new UserService();
        PlayerPresenceService presenceService = new PlayerPresenceService(event -> {
        });
        List<Object> events = new ArrayList<>();
        FriendService friendService = new FriendService(userService, new RateLimitService(), presenceService, events::add);
        var requester = userService.createGuestUser();
        var receiver = userService.createGuestUser();

        friendService.requestFriend(requester.userId(), receiver.username());

        FriendRequestRealtimeEvent event = events.stream()
                .filter(FriendRequestRealtimeEvent.class::isInstance)
                .map(FriendRequestRealtimeEvent.class::cast)
                .findFirst()
                .orElseThrow();
        assertEquals(receiver.userId(), event.targetUserId());
        assertEquals("FRIEND_REQUEST_RECEIVED", event.type());
    }

    @Test
    void acceptingFriendRequestPublishesRelationUpdateToRequester() {
        UserService userService = new UserService();
        PlayerPresenceService presenceService = new PlayerPresenceService(event -> {
        });
        List<Object> events = new ArrayList<>();
        FriendService friendService = new FriendService(userService, new RateLimitService(), presenceService, events::add);
        var requester = userService.createGuestUser();
        var receiver = userService.createGuestUser();

        friendService.requestFriend(requester.userId(), receiver.username());
        events.clear();
        friendService.acceptFriendRequest(receiver.userId(), requester.userId());

        FriendRequestRealtimeEvent event = events.stream()
                .filter(FriendRequestRealtimeEvent.class::isInstance)
                .map(FriendRequestRealtimeEvent.class::cast)
                .findFirst()
                .orElseThrow();
        assertEquals(requester.userId(), event.targetUserId());
        assertEquals("FRIEND_RELATION_UPDATED", event.type());
    }
}
