package com.wildhunt.service;

import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.common.util.Ids;
import com.wildhunt.service.event.RoomRealtimeEvent;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
public class InviteService {
    private final RoomService roomService;
    private final NotificationService notificationService;
    private final FriendService friendService;
    private final ApplicationEventPublisher events;
    private final RateLimitService rateLimitService;
    private final Map<String, Long> inviteRooms = new ConcurrentHashMap<>();

    public InviteService(RoomService roomService, NotificationService notificationService) {
        this(roomService, notificationService, new FriendService(new UserService()), event -> {}, new RateLimitService());
    }

    @Autowired
    public InviteService(RoomService roomService, NotificationService notificationService, FriendService friendService,
                         ApplicationEventPublisher events, RateLimitService rateLimitService) {
        this.roomService = roomService;
        this.notificationService = notificationService;
        this.friendService = friendService;
        this.events = events;
        this.rateLimitService = rateLimitService;
    }

    public Map<String, String> inviteFriend(Long inviterUserId, Long roomId, Long friendUserId) {
        rateLimitService.check("invite:" + inviterUserId, 10, Duration.ofMinutes(1), "邀请太频繁");
        if (!roomService.isActiveMember(inviterUserId, roomId)) {
            throw new BizException(ErrorCode.NOT_ROOM_MEMBER, "请先加入房间");
        }
        if (!friendService.canChat(inviterUserId, friendUserId)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "只能邀请已通过申请的好友");
        }
        String code = Ids.roomCode(6);
        inviteRooms.put(code, roomId);
        var notification = notificationService.push(friendUserId, "ROOM_INVITE", "房间邀请", "好友邀请你加入房间 " + roomId,
                Map.of("roomId", roomId, "inviteCode", code));
        events.publishEvent(RoomRealtimeEvent.targeted("ROOM_INVITE_RECEIVED", roomId, notification, friendUserId));
        return Map.of("inviteCode", code, "inviteLink", "http://localhost:5173?invite=" + code);
    }

    public Map<String, String> wechatInvite(Long inviterUserId, Long roomId) {
        rateLimitService.check("invite:wechat:" + inviterUserId, 10, Duration.ofMinutes(1), "邀请太频繁");
        if (!roomService.isActiveMember(inviterUserId, roomId)) {
            throw new BizException(ErrorCode.NOT_ROOM_MEMBER, "请先加入房间");
        }
        String code = Ids.roomCode(6);
        inviteRooms.put(code, roomId);
        return Map.of("inviteCode", code, "inviteLink", "http://localhost:5173?invite=" + code,
                "message", "微信接口待接入，已复制邀请链接");
    }

    public Map<String, Object> accept(Long userId, String inviteCode) {
        Long roomId = inviteRooms.get(inviteCode);
        if (roomId == null) throw new BizException(ErrorCode.NOT_FOUND, "邀请不存在或已过期");
        return Map.of("room", roomService.join(userId, roomId), "status", "ACCEPTED");
    }

    public Map<String, String> reject(String inviteCode) {
        inviteRooms.remove(inviteCode);
        return Map.of("status", "REJECTED");
    }
}
