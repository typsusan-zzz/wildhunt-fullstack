package com.wildhunt.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.common.util.Ids;
import com.wildhunt.dal.entity.RoomChatMessageEntity;
import com.wildhunt.dal.mapper.RoomChatMessageMapper;
import com.wildhunt.service.dto.RoomChatMessageDto;
import com.wildhunt.service.dto.UserProfile;
import com.wildhunt.service.event.RoomRealtimeEvent;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoomChatService {
    private static final int MAX_MESSAGE_LENGTH = 500;
    private static final int MAX_RECENT_MESSAGES = 200;

    private final RoomService roomService;
    private final UserService userService;
    private final ApplicationEventPublisher events;
    private final RoomChatMessageMapper roomChatMessageMapper;
    private final Map<Long, List<RoomChatMessageDto>> messages = new ConcurrentHashMap<>();
    private final Map<String, Deque<Instant>> rateBuckets = new ConcurrentHashMap<>();

    public RoomChatService(RoomService roomService, UserService userService, ApplicationEventPublisher events) {
        this(roomService, userService, events, (RoomChatMessageMapper) null);
    }

    @Autowired
    public RoomChatService(
            RoomService roomService,
            UserService userService,
            ApplicationEventPublisher events,
            ObjectProvider<RoomChatMessageMapper> roomChatMessageMapper) {
        this(roomService, userService, events, roomChatMessageMapper.getIfAvailable());
    }

    private RoomChatService(RoomService roomService, UserService userService, ApplicationEventPublisher events,
                            RoomChatMessageMapper roomChatMessageMapper) {
        this.roomService = roomService;
        this.userService = userService;
        this.events = events;
        this.roomChatMessageMapper = roomChatMessageMapper;
    }

    public List<RoomChatMessageDto> history(Long userId, Long roomId, int limit) {
        ensureMember(userId, roomId);
        int safeLimit = Math.min(100, Math.max(1, limit));
        List<RoomChatMessageDto> persisted = persistedHistory(roomId, safeLimit);
        if (!persisted.isEmpty()) return persisted;
        List<RoomChatMessageDto> roomMessages = messages.getOrDefault(roomId, List.of()).stream()
                .sorted(Comparator.comparing(RoomChatMessageDto::createdAt).reversed())
                .limit(safeLimit)
                .sorted(Comparator.comparing(RoomChatMessageDto::createdAt))
                .toList();
        return roomMessages;
    }

    @Transactional
    public RoomChatMessageDto sendMessage(Long userId, Long roomId, String content) {
        ensureMember(userId, roomId);
        String clean = sanitize(content);
        checkRateLimit(userId, roomId);
        UserProfile user = userService.getOrCreate(userId);
        RoomChatMessageDto message = new RoomChatMessageDto(Ids.nextId(), roomId, userId, user.nickname(), "USER", clean, LocalDateTime.now());
        persist(message);
        messages.compute(roomId, (ignored, old) -> {
            List<RoomChatMessageDto> next = old == null ? new ArrayList<>() : new ArrayList<>(old);
            next.add(message);
            if (next.size() > MAX_RECENT_MESSAGES) {
                next = new ArrayList<>(next.subList(next.size() - MAX_RECENT_MESSAGES, next.size()));
            }
            return next;
        });
        events.publishEvent(RoomRealtimeEvent.broadcast("ROOM_CHAT_MESSAGE", roomId, message));
        return message;
    }

    @Transactional
    public RoomChatMessageDto systemMessage(Long roomId, String content) {
        RoomChatMessageDto message = new RoomChatMessageDto(Ids.nextId(), roomId, null, "系统", "SYSTEM", sanitize(content), LocalDateTime.now());
        persist(message);
        messages.computeIfAbsent(roomId, ignored -> new ArrayList<>()).add(message);
        events.publishEvent(RoomRealtimeEvent.broadcast("ROOM_CHAT_MESSAGE", roomId, message));
        return message;
    }

    @EventListener
    public void onRoomMemberEvent(RoomRealtimeEvent event) {
        if (!"ROOM_MEMBER_EVENT".equals(event.type())) return;
        Object raw = event.message();
        String content = raw instanceof Map<?, ?> map ? String.valueOf(map.get("content")) : String.valueOf(raw);
        if (!content.isBlank()) systemMessage(event.roomId(), content);
    }

    private List<RoomChatMessageDto> persistedHistory(Long roomId, int limit) {
        try {
            if (roomChatMessageMapper == null) return List.of();
            return roomChatMessageMapper.selectList(new QueryWrapper<RoomChatMessageEntity>()
                            .eq("room_id", roomId)
                            .eq("deleted", 0)
                            .orderByDesc("created_at")
                            .last("LIMIT " + limit))
                    .stream()
                    .map(this::toDto)
                    .sorted(Comparator.comparing(RoomChatMessageDto::createdAt))
                    .toList();
        } catch (RuntimeException ignored) {
            return List.of();
        }
    }

    private void persist(RoomChatMessageDto message) {
        try {
            if (roomChatMessageMapper == null) return;
            RoomChatMessageEntity entity = new RoomChatMessageEntity();
            entity.setId(Long.valueOf(String.valueOf(message.id())));
            entity.setRoomId(Long.valueOf(String.valueOf(message.roomId())));
            entity.setUserId(message.userId() == null ? null : Long.valueOf(String.valueOf(message.userId())));
            entity.setMessageType(message.messageType());
            entity.setContent(message.content());
            entity.setCreatedAt(message.createdAt());
            entity.setUpdatedAt(message.createdAt());
            entity.setDeleted(0);
            roomChatMessageMapper.insert(entity);
        } catch (RuntimeException ignored) {
            // Database persistence is best-effort in local development.
        }
    }

    private RoomChatMessageDto toDto(RoomChatMessageEntity entity) {
        String nickname = entity.getUserId() == null ? "系统" : userService.getOrCreate(entity.getUserId()).nickname();
        return new RoomChatMessageDto(entity.getId(), entity.getRoomId(), entity.getUserId(), nickname,
                entity.getMessageType(), entity.getContent(), entity.getCreatedAt());
    }

    private void ensureMember(Long userId, Long roomId) {
        if (!roomService.isActiveMember(userId, roomId)) {
            throw new BizException(ErrorCode.NOT_ROOM_MEMBER, "只有房间成员可以访问聊天");
        }
    }

    private static String sanitize(String content) {
        if (content == null) throw new BizException(ErrorCode.BAD_REQUEST, "消息不能为空");
        String clean = content.trim();
        if (clean.isEmpty() || clean.length() > MAX_MESSAGE_LENGTH) {
            throw new BizException(ErrorCode.BAD_REQUEST, "消息长度需为 1-500 字");
        }
        return ContentGuard.cleanDisplayText(clean, "", MAX_MESSAGE_LENGTH);
    }

    private void checkRateLimit(Long userId, Long roomId) {
        String key = roomId + ":" + userId;
        Instant now = Instant.now();
        Deque<Instant> bucket = rateBuckets.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        synchronized (bucket) {
            while (!bucket.isEmpty() && Duration.between(bucket.peekFirst(), now).toMillis() > 1000) {
                bucket.removeFirst();
            }
            if (bucket.size() >= 3) {
                throw new BizException(ErrorCode.CHAT_RATE_LIMITED, "发送太快了");
            }
            bucket.addLast(now);
        }
    }
}
