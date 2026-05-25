package com.wildhunt.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.common.util.Ids;
import com.wildhunt.dal.entity.FriendChatMessageEntity;
import com.wildhunt.dal.mapper.FriendChatMessageMapper;
import com.wildhunt.service.dto.FriendChatMessageDto;
import com.wildhunt.service.dto.FriendConversationDto;
import com.wildhunt.service.dto.UserProfile;
import com.wildhunt.service.event.FriendChatRealtimeEvent;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FriendChatService {
    private static final int MAX_MESSAGE_LENGTH = 500;
    private static final int MAX_RECENT_MESSAGES = 500;

    private final UserService userService;
    private final FriendService friendService;
    private final PlayerPresenceService presenceService;
    private final FriendChatMessageMapper messageMapper;
    private final ApplicationEventPublisher events;
    private final Map<String, List<StoredMessage>> fallbackMessages = new ConcurrentHashMap<>();
    private final Map<String, Deque<Instant>> rateBuckets = new ConcurrentHashMap<>();

    public FriendChatService(UserService userService, FriendService friendService, PlayerPresenceService presenceService) {
        this(userService, friendService, presenceService, (FriendChatMessageMapper) null, event -> {
        });
    }

    @Autowired
    public FriendChatService(
            UserService userService,
            FriendService friendService,
            PlayerPresenceService presenceService,
            ObjectProvider<FriendChatMessageMapper> messageMapper,
            ApplicationEventPublisher events) {
        this(userService, friendService, presenceService, messageMapper.getIfAvailable(), events);
    }

    FriendChatService(
            UserService userService,
            FriendService friendService,
            PlayerPresenceService presenceService,
            FriendChatMessageMapper messageMapper,
            ApplicationEventPublisher events) {
        this.userService = userService;
        this.friendService = friendService;
        this.presenceService = presenceService;
        this.messageMapper = messageMapper;
        this.events = events;
    }

    public List<FriendConversationDto> conversations(Long userId) {
        ensureUser(userId);
        Map<Long, ConversationDraft> drafts = new LinkedHashMap<>();
        for (StoredMessage message : recentMessages(userId, 300)) {
            Long peerUserId = message.senderUserId().equals(userId) ? message.receiverUserId() : message.senderUserId();
            ConversationDraft draft = drafts.computeIfAbsent(peerUserId, ignored -> new ConversationDraft());
            if (draft.lastMessage == null || message.createdAt().isAfter(draft.lastMessage.createdAt())) {
                draft.lastMessage = message;
            }
            if (message.receiverUserId().equals(userId) && message.readAt() == null) {
                draft.unreadCount += 1;
            }
        }
        for (Map<String, Object> friend : friendService.listFriends(userId)) {
            Object rawUserId = friend.get("userId");
            if (rawUserId != null) drafts.computeIfAbsent(Long.valueOf(String.valueOf(rawUserId)), ignored -> new ConversationDraft());
        }
        return drafts.entrySet().stream()
                .map(entry -> toConversation(userId, entry.getKey(), entry.getValue()))
                .sorted(Comparator
                        .comparing(FriendConversationDto::lastMessageAt, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(FriendConversationDto::nickname))
                .toList();
    }

    public List<FriendChatMessageDto> history(Long userId, Long friendUserId, int limit) {
        ensureCanChat(userId, friendUserId);
        int safeLimit = Math.min(100, Math.max(1, limit));
        return pairMessages(userId, friendUserId, safeLimit).stream()
                .map(message -> toDto(userId, message))
                .toList();
    }

    @Transactional
    public FriendChatMessageDto sendMessage(Long senderUserId, Long receiverUserId, String content) {
        ensureCanChat(senderUserId, receiverUserId);
        checkRateLimit(senderUserId, receiverUserId);
        String clean = sanitize(content);
        StoredMessage message = new StoredMessage(Ids.nextId(), senderUserId, receiverUserId, clean, null, LocalDateTime.now());
        if (!persist(message)) addFallback(message);
        FriendChatMessageDto receiverDto = toDto(receiverUserId, message);
        events.publishEvent(new FriendChatRealtimeEvent(receiverUserId, "FRIEND_CHAT_MESSAGE", receiverDto));
        return toDto(senderUserId, message);
    }

    @Transactional
    public Map<String, Integer> markRead(Long userId, Long friendUserId) {
        ensureCanChat(userId, friendUserId);
        LocalDateTime readAt = LocalDateTime.now();
        int updated = markPersistedRead(userId, friendUserId, readAt) + markFallbackRead(userId, friendUserId, readAt);
        events.publishEvent(new FriendChatRealtimeEvent(friendUserId, "FRIEND_CHAT_READ",
                Map.of("friendUserId", userId, "readCount", updated)));
        return Map.of("readCount", updated);
    }

    private FriendConversationDto toConversation(Long userId, Long friendUserId, ConversationDraft draft) {
        UserProfile friend = userService.getOrCreate(friendUserId);
        PlayerPresenceService.PresenceState presence = presenceService.stateOf(friendUserId);
        return new FriendConversationDto(
                friendUserId,
                friend.nickname(),
                presence.state(),
                "PLAYING".equals(presence.state()),
                draft.lastMessage == null ? "" : draft.lastMessage.content(),
                draft.lastMessage == null ? null : draft.lastMessage.createdAt(),
                draft.unreadCount);
    }

    private List<StoredMessage> recentMessages(Long userId, int limit) {
        List<StoredMessage> persisted = persistedRecentMessages(userId, limit);
        if (!persisted.isEmpty()) return persisted;
        return fallbackMessages.values().stream()
                .flatMap(List::stream)
                .filter(message -> message.senderUserId().equals(userId) || message.receiverUserId().equals(userId))
                .sorted(Comparator.comparing(StoredMessage::createdAt).reversed())
                .limit(limit)
                .toList();
    }

    private List<StoredMessage> pairMessages(Long userId, Long friendUserId, int limit) {
        List<StoredMessage> persisted = persistedPairMessages(userId, friendUserId, limit);
        if (!persisted.isEmpty()) return persisted;
        return fallbackMessages.getOrDefault(pairKey(userId, friendUserId), List.of()).stream()
                .sorted(Comparator.comparing(StoredMessage::createdAt).reversed())
                .limit(limit)
                .sorted(Comparator.comparing(StoredMessage::createdAt))
                .toList();
    }

    private List<StoredMessage> persistedRecentMessages(Long userId, int limit) {
        try {
            if (messageMapper == null) return List.of();
            return messageMapper.selectList(new QueryWrapper<FriendChatMessageEntity>()
                            .eq("deleted", 0)
                            .and(wrapper -> wrapper.eq("sender_user_id", userId).or().eq("receiver_user_id", userId))
                            .orderByDesc("created_at")
                            .last("LIMIT " + limit))
                    .stream()
                    .map(this::fromEntity)
                    .toList();
        } catch (RuntimeException ignored) {
            return List.of();
        }
    }

    private List<StoredMessage> persistedPairMessages(Long userId, Long friendUserId, int limit) {
        try {
            if (messageMapper == null) return List.of();
            return messageMapper.selectList(new QueryWrapper<FriendChatMessageEntity>()
                            .eq("deleted", 0)
                            .and(wrapper -> wrapper
                                    .eq("sender_user_id", userId).eq("receiver_user_id", friendUserId)
                                    .or()
                                    .eq("sender_user_id", friendUserId).eq("receiver_user_id", userId))
                            .orderByDesc("created_at")
                            .last("LIMIT " + limit))
                    .stream()
                    .map(this::fromEntity)
                    .sorted(Comparator.comparing(StoredMessage::createdAt))
                    .toList();
        } catch (RuntimeException ignored) {
            return List.of();
        }
    }

    private boolean persist(StoredMessage message) {
        try {
            if (messageMapper == null) return false;
            FriendChatMessageEntity entity = new FriendChatMessageEntity();
            entity.setId(message.id());
            entity.setSenderUserId(message.senderUserId());
            entity.setReceiverUserId(message.receiverUserId());
            entity.setContent(message.content());
            entity.setReadAt(message.readAt());
            entity.setCreatedAt(message.createdAt());
            entity.setUpdatedAt(message.createdAt());
            entity.setDeleted(0);
            messageMapper.insert(entity);
            return true;
        } catch (RuntimeException ignored) {
            // Local development can run without database persistence.
            return false;
        }
    }

    private int markPersistedRead(Long userId, Long friendUserId, LocalDateTime readAt) {
        try {
            if (messageMapper == null) return 0;
            return messageMapper.update(null, new UpdateWrapper<FriendChatMessageEntity>()
                    .set("read_at", readAt)
                    .set("updated_at", readAt)
                    .eq("sender_user_id", friendUserId)
                    .eq("receiver_user_id", userId)
                    .isNull("read_at")
                    .eq("deleted", 0));
        } catch (RuntimeException ignored) {
            return 0;
        }
    }

    private int markFallbackRead(Long userId, Long friendUserId, LocalDateTime readAt) {
        List<StoredMessage> messages = fallbackMessages.getOrDefault(pairKey(userId, friendUserId), List.of());
        int updated = 0;
        synchronized (messages) {
            for (int index = 0; index < messages.size(); index += 1) {
                StoredMessage message = messages.get(index);
                if (message.senderUserId().equals(friendUserId) && message.receiverUserId().equals(userId) && message.readAt() == null) {
                    messages.set(index, message.withReadAt(readAt));
                    updated += 1;
                }
            }
        }
        return updated;
    }

    private void addFallback(StoredMessage message) {
        List<StoredMessage> messages = fallbackMessages.computeIfAbsent(pairKey(message.senderUserId(), message.receiverUserId()),
                ignored -> new ArrayList<>());
        synchronized (messages) {
            messages.add(message);
            if (messages.size() > MAX_RECENT_MESSAGES) {
                messages.subList(0, messages.size() - MAX_RECENT_MESSAGES).clear();
            }
        }
    }

    private FriendChatMessageDto toDto(Long viewerUserId, StoredMessage message) {
        UserProfile sender = userService.getOrCreate(message.senderUserId());
        UserProfile receiver = userService.getOrCreate(message.receiverUserId());
        Long peerUserId = message.senderUserId().equals(viewerUserId) ? message.receiverUserId() : message.senderUserId();
        boolean read = message.receiverUserId().equals(viewerUserId) ? message.readAt() != null : true;
        return new FriendChatMessageDto(message.id(), message.senderUserId(), message.receiverUserId(), peerUserId,
                sender.nickname(), receiver.nickname(), message.content(), read, message.createdAt());
    }

    private StoredMessage fromEntity(FriendChatMessageEntity entity) {
        return new StoredMessage(entity.getId(), entity.getSenderUserId(), entity.getReceiverUserId(),
                entity.getContent(), entity.getReadAt(), entity.getCreatedAt());
    }

    private void ensureCanChat(Long userId, Long friendUserId) {
        ensureUser(userId);
        if (!friendService.canChat(userId, friendUserId)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "只能给好友发送消息");
        }
    }

    private static void ensureUser(Long userId) {
        if (userId == null || userId <= 0) throw new BizException(ErrorCode.UNAUTHORIZED, "请重新登录");
    }

    private static String sanitize(String content) {
        if (content == null) throw new BizException(ErrorCode.BAD_REQUEST, "消息不能为空");
        String clean = content.trim();
        if (clean.isEmpty() || clean.length() > MAX_MESSAGE_LENGTH) {
            throw new BizException(ErrorCode.BAD_REQUEST, "消息长度需为 1-500 字");
        }
        return ContentGuard.cleanDisplayText(clean, "", MAX_MESSAGE_LENGTH);
    }

    private void checkRateLimit(Long userId, Long friendUserId) {
        String key = userId + ":" + friendUserId;
        Instant now = Instant.now();
        Deque<Instant> bucket = rateBuckets.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        synchronized (bucket) {
            while (!bucket.isEmpty() && Duration.between(bucket.peekFirst(), now).toSeconds() >= 5) {
                bucket.removeFirst();
            }
            if (bucket.size() >= 8) {
                throw new BizException(ErrorCode.CHAT_RATE_LIMITED, "发送太快了");
            }
            bucket.addLast(now);
        }
    }

    private static String pairKey(Long firstUserId, Long secondUserId) {
        long first = Math.min(firstUserId, secondUserId);
        long second = Math.max(firstUserId, secondUserId);
        return first + ":" + second;
    }

    private static final class ConversationDraft {
        StoredMessage lastMessage;
        int unreadCount;
    }

    private record StoredMessage(Long id, Long senderUserId, Long receiverUserId, String content, LocalDateTime readAt,
                                 LocalDateTime createdAt) {
        StoredMessage withReadAt(LocalDateTime nextReadAt) {
            return new StoredMessage(id, senderUserId, receiverUserId, content, nextReadAt, createdAt);
        }
    }
}
