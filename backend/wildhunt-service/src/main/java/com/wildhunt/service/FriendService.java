package com.wildhunt.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.common.util.Ids;
import com.wildhunt.dal.entity.FriendRelationEntity;
import com.wildhunt.dal.entity.FriendRequestEntity;
import com.wildhunt.dal.mapper.FriendRelationMapper;
import com.wildhunt.dal.mapper.FriendRequestMapper;
import com.wildhunt.service.dto.UserProfile;
import com.wildhunt.service.event.FriendRequestRealtimeEvent;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FriendService {
    private static final String ACCEPTED = "ACCEPTED";
    private static final String PENDING = "PENDING";
    private static final String REJECTED = "REJECTED";

    private final UserService userService;
    private final RateLimitService rateLimitService;
    private final PlayerPresenceService presenceService;
    private final FriendRelationMapper relationMapper;
    private final FriendRequestMapper requestMapper;
    private final ApplicationEventPublisher events;
    private final Map<Long, Set<Long>> friends = new ConcurrentHashMap<>();
    private final Map<String, FriendRequestRecord> pendingRequests = new ConcurrentHashMap<>();

    public FriendService(UserService userService) {
        this(userService, new RateLimitService(), new PlayerPresenceService(),
                (FriendRelationMapper) null, (FriendRequestMapper) null, event -> {
                });
    }

    public FriendService(UserService userService, RateLimitService rateLimitService, PlayerPresenceService presenceService) {
        this(userService, rateLimitService, presenceService, (FriendRelationMapper) null, (FriendRequestMapper) null, event -> {
        });
    }

    FriendService(UserService userService, RateLimitService rateLimitService, PlayerPresenceService presenceService,
                  ApplicationEventPublisher events) {
        this(userService, rateLimitService, presenceService, (FriendRelationMapper) null, (FriendRequestMapper) null, events);
    }

    @Autowired
    public FriendService(UserService userService, RateLimitService rateLimitService, PlayerPresenceService presenceService,
                         ObjectProvider<FriendRelationMapper> relationMapper,
                         ObjectProvider<FriendRequestMapper> requestMapper,
                         ApplicationEventPublisher events) {
        this(userService, rateLimitService, presenceService, relationMapper.getIfAvailable(), requestMapper.getIfAvailable(), events);
    }

    private FriendService(UserService userService, RateLimitService rateLimitService, PlayerPresenceService presenceService,
                          FriendRelationMapper relationMapper, FriendRequestMapper requestMapper,
                          ApplicationEventPublisher events) {
        this.userService = userService;
        this.rateLimitService = rateLimitService;
        this.presenceService = presenceService;
        this.relationMapper = relationMapper;
        this.requestMapper = requestMapper;
        this.events = events;
    }

    public List<Map<String, Object>> listFriends(Long userId) {
        ensureUser(userId);
        return acceptedFriendIds(userId).stream()
                .map(userService::get)
                .filter(user -> user != null)
                .sorted(Comparator.comparing(UserProfile::nickname))
                .map(user -> friendMap(user.userId(), user.nickname(), ACCEPTED))
                .toList();
    }

    public List<Map<String, Object>> searchUsers(Long userId, String keyword) {
        ensureUser(userId);
        String normalized = normalize(keyword);
        if (normalized.isBlank()) return List.of();
        return userService.allUsers().stream()
                .filter(user -> !user.userId().equals(userId))
                .filter(user -> normalize(user.username()).contains(normalized) || normalize(user.nickname()).contains(normalized))
                .sorted(Comparator.comparing(UserProfile::nickname))
                .limit(20)
                .map(user -> userSearchMap(userId, user))
                .toList();
    }

    @Transactional
    public Map<String, Object> requestFriend(Long userId, String username) {
        UserProfile target = findUserByName(username);
        if (target == null) throw new BizException(ErrorCode.NOT_FOUND, "用户不存在");
        return requestFriendByUserId(userId, target.userId(), "SEARCH");
    }

    @Transactional
    public Map<String, Object> requestFriendByUserId(Long userId, Long targetUserId, String source) {
        ensureUser(userId);
        UserProfile target = userService.get(targetUserId);
        if (target == null) throw new BizException(ErrorCode.NOT_FOUND, "用户不存在");
        if (userId.equals(targetUserId)) throw new BizException(ErrorCode.BAD_REQUEST, "不能添加自己为好友");
        rateLimitService.check("friend:request:" + userId, 12, Duration.ofMinutes(1), "好友申请太频繁");

        if (isAccepted(userId, targetUserId)) {
            return friendMap(target.userId(), target.nickname(), ACCEPTED);
        }
        FriendRequestRecord reverse = pendingRequest(targetUserId, userId);
        if (reverse != null) {
            acceptFriendRequest(userId, targetUserId);
            return friendMap(target.userId(), target.nickname(), ACCEPTED);
        }
        FriendRequestRecord existing = pendingRequest(userId, targetUserId);
        if (existing == null) {
            FriendRequestRecord next = new FriendRequestRecord(Ids.nextId(), userId, targetUserId, PENDING, source, LocalDateTime.now());
            pendingRequests.put(requestKey(userId, targetUserId), next);
            persistRequest(next);
            events.publishEvent(new FriendRequestRealtimeEvent(targetUserId, "FRIEND_REQUEST_RECEIVED",
                    requestMap(targetUserId, next, "RECEIVED")));
        }
        return friendMap(target.userId(), target.nickname(), PENDING);
    }

    @Transactional
    public Map<String, Object> acceptFriendRequest(Long userId, Long requesterUserId) {
        ensureUser(userId);
        UserProfile requester = userService.get(requesterUserId);
        if (requester == null) throw new BizException(ErrorCode.NOT_FOUND, "用户不存在");
        FriendRequestRecord request = pendingRequest(requesterUserId, userId);
        if (request == null && !isAccepted(userId, requesterUserId)) {
            throw new BizException(ErrorCode.NOT_FOUND, "好友申请不存在");
        }
        acceptRelation(userId, requesterUserId);
        pendingRequests.remove(requestKey(requesterUserId, userId));
        updateRequestStatus(requesterUserId, userId, ACCEPTED);
        UserProfile accepter = userService.getOrCreate(userId);
        events.publishEvent(new FriendRequestRealtimeEvent(requesterUserId, "FRIEND_RELATION_UPDATED",
                friendMap(accepter.userId(), accepter.nickname(), ACCEPTED)));
        return friendMap(requester.userId(), requester.nickname(), ACCEPTED);
    }

    @Transactional
    public Map<String, Object> rejectFriendRequest(Long userId, Long requesterUserId) {
        ensureUser(userId);
        UserProfile requester = userService.get(requesterUserId);
        if (requester == null) throw new BizException(ErrorCode.NOT_FOUND, "用户不存在");
        FriendRequestRecord request = pendingRequest(requesterUserId, userId);
        if (request == null) throw new BizException(ErrorCode.NOT_FOUND, "好友申请不存在");
        pendingRequests.remove(requestKey(requesterUserId, userId));
        updateRequestStatus(requesterUserId, userId, REJECTED);
        return requestMap(userId, request.withStatus(REJECTED), "RECEIVED");
    }

    public Map<String, List<Map<String, Object>>> pendingRequests(Long userId) {
        ensureUser(userId);
        List<FriendRequestRecord> requests = new ArrayList<>(fallbackPendingRequests());
        requests.addAll(persistedPendingRequests());
        Map<String, FriendRequestRecord> unique = new LinkedHashMap<>();
        for (FriendRequestRecord request : requests) {
            unique.put(requestKey(request.fromUserId(), request.toUserId()), request);
        }
        List<Map<String, Object>> received = unique.values().stream()
                .filter(request -> request.toUserId().equals(userId))
                .map(request -> requestMap(userId, request, "RECEIVED"))
                .toList();
        List<Map<String, Object>> sent = unique.values().stream()
                .filter(request -> request.fromUserId().equals(userId))
                .map(request -> requestMap(userId, request, "SENT"))
                .toList();
        return Map.of("received", received, "sent", sent);
    }

    public Map<String, Object> clearFriendData() {
        int relationCount = friends.values().stream().mapToInt(Set::size).sum();
        int requestCount = pendingRequests.size();
        friends.clear();
        pendingRequests.clear();
        softDeleteAll();
        return Map.of("relations", relationCount, "requests", requestCount);
    }

    public int friendCount(Long userId) {
        return acceptedFriendIds(userId).size();
    }

    public boolean canChat(Long userId, Long friendUserId) {
        if (userId == null || friendUserId == null || userId.equals(friendUserId)) return false;
        return isAccepted(userId, friendUserId);
    }

    public Set<Long> watchersOf(Long changedUserId) {
        Set<Long> watchers = new HashSet<>();
        if (changedUserId == null) return watchers;
        friends.forEach((ownerUserId, friendIds) -> {
            if (friendIds.contains(changedUserId)) watchers.add(ownerUserId);
        });
        watchers.addAll(persistedWatchersOf(changedUserId));
        return watchers;
    }

    private UserProfile findUserByName(String username) {
        String normalized = normalize(username);
        if (normalized.isBlank()) return null;
        return userService.allUsers().stream()
                .filter(user -> normalize(user.username()).equals(normalized) || normalize(user.nickname()).equals(normalized))
                .findFirst()
                .orElse(null);
    }

    private void acceptRelation(Long userId, Long friendUserId) {
        friends.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(friendUserId);
        friends.computeIfAbsent(friendUserId, ignored -> ConcurrentHashMap.newKeySet()).add(userId);
        persistRelation(userId, friendUserId);
        persistRelation(friendUserId, userId);
    }

    private Set<Long> acceptedFriendIds(Long userId) {
        Set<Long> result = new HashSet<>(friends.getOrDefault(userId, Set.of()));
        result.addAll(persistedAcceptedFriendIds(userId));
        return result;
    }

    private boolean isAccepted(Long userId, Long friendUserId) {
        return acceptedFriendIds(userId).contains(friendUserId);
    }

    private FriendRequestRecord pendingRequest(Long fromUserId, Long toUserId) {
        FriendRequestRecord fallback = pendingRequests.get(requestKey(fromUserId, toUserId));
        if (fallback != null) return fallback;
        return persistedPendingRequest(fromUserId, toUserId);
    }

    private List<FriendRequestRecord> fallbackPendingRequests() {
        return pendingRequests.values().stream().filter(request -> PENDING.equals(request.status())).toList();
    }

    private Map<String, Object> userSearchMap(Long viewerUserId, UserProfile user) {
        Map<String, Object> result = friendMap(user.userId(), user.nickname(), relationStatus(viewerUserId, user.userId()));
        result.put("username", user.username());
        return result;
    }

    private String relationStatus(Long userId, Long targetUserId) {
        if (isAccepted(userId, targetUserId)) return ACCEPTED;
        if (pendingRequest(userId, targetUserId) != null) return "PENDING_SENT";
        if (pendingRequest(targetUserId, userId) != null) return "PENDING_RECEIVED";
        return "NONE";
    }

    private Map<String, Object> requestMap(Long viewerUserId, FriendRequestRecord request, String direction) {
        Long peerUserId = "RECEIVED".equals(direction) ? request.fromUserId() : request.toUserId();
        UserProfile peer = userService.getOrCreate(peerUserId);
        Map<String, Object> result = friendMap(peer.userId(), peer.nickname(), request.status());
        result.put("username", peer.username());
        result.put("requesterUserId", request.fromUserId());
        result.put("targetUserId", request.toUserId());
        result.put("direction", direction);
        result.put("source", request.message() == null ? "" : request.message());
        result.put("mine", viewerUserId.equals(request.fromUserId()));
        return result;
    }

    private Map<String, Object> friendMap(Long userId, String nickname, String status) {
        PlayerPresenceService.PresenceState presence = presenceService.stateOf(userId);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("userId", userId);
        result.put("nickname", nickname);
        result.put("status", status);
        result.put("onlineState", presence.state());
        result.put("inGame", "PLAYING".equals(presence.state()));
        if (presence.roomId() != null) result.put("roomId", presence.roomId());
        if (presence.matchId() != null) result.put("matchId", presence.matchId());
        return result;
    }

    private Set<Long> persistedAcceptedFriendIds(Long userId) {
        try {
            if (relationMapper == null) return Set.of();
            List<FriendRelationEntity> rows = relationMapper.selectList(new QueryWrapper<FriendRelationEntity>()
                    .eq("user_id", userId)
                    .eq("status", ACCEPTED)
                    .eq("deleted", 0));
            Set<Long> result = new HashSet<>();
            for (FriendRelationEntity row : rows) result.add(row.getFriendUserId());
            return result;
        } catch (RuntimeException ignored) {
            return Set.of();
        }
    }

    private Set<Long> persistedWatchersOf(Long changedUserId) {
        try {
            if (relationMapper == null) return Set.of();
            List<FriendRelationEntity> rows = relationMapper.selectList(new QueryWrapper<FriendRelationEntity>()
                    .eq("friend_user_id", changedUserId)
                    .eq("status", ACCEPTED)
                    .eq("deleted", 0));
            Set<Long> result = new HashSet<>();
            for (FriendRelationEntity row : rows) result.add(row.getUserId());
            return result;
        } catch (RuntimeException ignored) {
            return Set.of();
        }
    }

    private List<FriendRequestRecord> persistedPendingRequests() {
        try {
            if (requestMapper == null) return List.of();
            return requestMapper.selectList(new QueryWrapper<FriendRequestEntity>()
                            .eq("status", PENDING)
                            .eq("deleted", 0))
                    .stream()
                    .map(this::toRecord)
                    .toList();
        } catch (RuntimeException ignored) {
            return List.of();
        }
    }

    private FriendRequestRecord persistedPendingRequest(Long fromUserId, Long toUserId) {
        try {
            if (requestMapper == null) return null;
            FriendRequestEntity row = requestMapper.selectOne(new QueryWrapper<FriendRequestEntity>()
                    .eq("from_user_id", fromUserId)
                    .eq("to_user_id", toUserId)
                    .eq("status", PENDING)
                    .eq("deleted", 0)
                    .last("LIMIT 1"));
            return row == null ? null : toRecord(row);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private void persistRelation(Long userId, Long friendUserId) {
        try {
            if (relationMapper == null) return;
            LocalDateTime now = LocalDateTime.now();
            FriendRelationEntity entity = relationMapper.selectOne(new QueryWrapper<FriendRelationEntity>()
                    .eq("user_id", userId)
                    .eq("friend_user_id", friendUserId)
                    .last("LIMIT 1"));
            boolean insert = entity == null;
            if (entity == null) {
                entity = new FriendRelationEntity();
                entity.setId(Ids.nextId());
                entity.setUserId(userId);
                entity.setFriendUserId(friendUserId);
                entity.setCreatedAt(now);
            }
            entity.setStatus(ACCEPTED);
            entity.setUpdatedAt(now);
            entity.setDeleted(0);
            if (insert) relationMapper.insert(entity);
            else relationMapper.updateById(entity);
        } catch (RuntimeException ignored) {
            // Keep local development usable without MySQL.
        }
    }

    private void persistRequest(FriendRequestRecord request) {
        try {
            if (requestMapper == null) return;
            LocalDateTime now = LocalDateTime.now();
            FriendRequestEntity entity = new FriendRequestEntity();
            entity.setId(request.id());
            entity.setFromUserId(request.fromUserId());
            entity.setToUserId(request.toUserId());
            entity.setStatus(request.status());
            entity.setMessage(request.message());
            entity.setCreatedAt(now);
            entity.setUpdatedAt(now);
            entity.setDeleted(0);
            requestMapper.insert(entity);
        } catch (RuntimeException ignored) {
            // Keep local development usable without MySQL.
        }
    }

    private void updateRequestStatus(Long fromUserId, Long toUserId, String status) {
        try {
            if (requestMapper == null) return;
            requestMapper.update(null, new UpdateWrapper<FriendRequestEntity>()
                    .set("status", status)
                    .set("updated_at", LocalDateTime.now())
                    .eq("from_user_id", fromUserId)
                    .eq("to_user_id", toUserId)
                    .eq("status", PENDING)
                    .eq("deleted", 0));
        } catch (RuntimeException ignored) {
            // Keep local development usable without MySQL.
        }
    }

    private void softDeleteAll() {
        try {
            if (relationMapper != null) {
                relationMapper.update(null, new UpdateWrapper<FriendRelationEntity>()
                        .set("deleted", 1)
                        .set("updated_at", LocalDateTime.now())
                        .eq("deleted", 0));
            }
            if (requestMapper != null) {
                requestMapper.update(null, new UpdateWrapper<FriendRequestEntity>()
                        .set("deleted", 1)
                        .set("updated_at", LocalDateTime.now())
                        .eq("deleted", 0));
            }
        } catch (RuntimeException ignored) {
            // Keep cleanup best-effort.
        }
    }

    private FriendRequestRecord toRecord(FriendRequestEntity entity) {
        return new FriendRequestRecord(entity.getId(), entity.getFromUserId(), entity.getToUserId(),
                entity.getStatus(), entity.getMessage(), entity.getCreatedAt());
    }

    private void ensureUser(Long userId) {
        if (userId == null || userService.get(userId) == null) {
            throw new BizException(ErrorCode.UNAUTHORIZED, "请先登录");
        }
    }

    private static String requestKey(Long fromUserId, Long toUserId) {
        return fromUserId + ":" + toUserId;
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private record FriendRequestRecord(Long id, Long fromUserId, Long toUserId, String status, String message, LocalDateTime createdAt) {
        FriendRequestRecord withStatus(String nextStatus) {
            return new FriendRequestRecord(id, fromUserId, toUserId, nextStatus, message, createdAt);
        }
    }
}
