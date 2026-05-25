package com.wildhunt.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.wildhunt.common.enums.QueueType;
import com.wildhunt.common.enums.RoleType;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.common.util.Ids;
import com.wildhunt.dal.entity.MatchQueueEntity;
import com.wildhunt.dal.mapper.MatchQueueMapper;
import com.wildhunt.service.GameMatchService.PlayerAssignment;
import com.wildhunt.service.dto.MatchmakingResult;
import com.wildhunt.service.dto.RoomSnapshot;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MatchmakingService {
    private final RoomService roomService;
    private final MatchQueueMapper matchQueueMapper;
    private final RateLimitService rateLimitService;
    private final PlayerPresenceService presenceService;
    private final Map<Long, QueueEntry> waiting = new ConcurrentHashMap<>();
    private final Map<Long, MatchmakingResult> lastResult = new ConcurrentHashMap<>();

    public MatchmakingService(RoomService roomService) {
        this(roomService, (MatchQueueMapper) null, new RateLimitService(), new PlayerPresenceService());
    }

    @Autowired
    public MatchmakingService(RoomService roomService, ObjectProvider<MatchQueueMapper> matchQueueMapper,
                              RateLimitService rateLimitService, PlayerPresenceService presenceService) {
        this(roomService, matchQueueMapper.getIfAvailable(), rateLimitService, presenceService);
    }

    private MatchmakingService(RoomService roomService, MatchQueueMapper matchQueueMapper, RateLimitService rateLimitService,
                               PlayerPresenceService presenceService) {
        this.roomService = roomService;
        this.matchQueueMapper = matchQueueMapper;
        this.rateLimitService = rateLimitService;
        this.presenceService = presenceService;
    }

    @Transactional
    public synchronized MatchmakingResult enqueue(Long userId, QueueType queueType) {
        if (userId == null) throw new BizException(ErrorCode.UNAUTHORIZED, "请重新登录");
        rateLimitService.check("match:enqueue:" + userId, 8, Duration.ofMinutes(1), "匹配操作太频繁");
        if (roomService.currentRoom(userId) != null) {
            throw new BizException(ErrorCode.ALREADY_IN_ROOM, "你已在房间内，请先退出房间再匹配");
        }
        MatchmakingResult oldResult = lastResult.get(userId);
        if (oldResult != null && "MATCHED".equals(oldResult.status())) return oldResult;
        if (waiting.containsKey(userId) || hasWaitingQueue(userId)) {
            throw new BizException(ErrorCode.MATCH_ALREADY_QUEUED, "你已在匹配队列中");
        }

        QueueType safeQueue = queueType == null ? QueueType.AUTO : queueType;
        presenceService.setMatching(userId);
        Long queueId = persistQueue(userId, safeQueue, "WAITING", null, null);
        if (safeQueue == QueueType.WOLF) {
            Optional<QueueEntry> deer = oldest(QueueType.DEER);
            if (deer.isPresent()) {
                waiting.remove(deer.get().userId());
                MatchmakingResult wolfResult = matchPair(userId, deer.get().userId());
                markMatched(queueId, wolfResult);
                markMatched(deer.get().queueId(), wolfResult);
                MatchmakingResult deerResult = new MatchmakingResult("MATCHED", wolfResult.roomId(), wolfResult.matchId(),
                        RoleType.DEER, wolfResult.room());
                lastResult.put(deer.get().userId(), deerResult);
                return wolfResult;
            }
            MatchmakingResult result = matchImmediately(userId, QueueType.WOLF, RoleType.WOLF);
            markMatched(queueId, result);
            return result;
        }
        if (safeQueue == QueueType.AUTO) {
            Optional<QueueEntry> deer = oldest(QueueType.DEER);
            if (deer.isPresent()) {
                waiting.remove(deer.get().userId());
                MatchmakingResult result = matchPair(userId, deer.get().userId());
                markMatched(queueId, result);
                markMatched(deer.get().queueId(), result);
                lastResult.put(deer.get().userId(), new MatchmakingResult("MATCHED", result.roomId(), result.matchId(),
                        RoleType.DEER, result.room()));
                return result;
            }
            MatchmakingResult result = matchImmediately(userId, QueueType.AUTO, RoleType.WOLF);
            markMatched(queueId, result);
            return result;
        }

        MatchmakingResult result = matchImmediately(userId, QueueType.DEER, RoleType.DEER);
        markMatched(queueId, result);
        return result;
    }

    public MatchmakingResult status(Long userId) {
        MatchmakingResult result = lastResult.get(userId);
        if (result != null) return result;
        return waiting.containsKey(userId) || hasWaitingQueue(userId)
                ? MatchmakingResult.waiting()
                : new MatchmakingResult("IDLE", null, null, null, null);
    }

    @Transactional
    public void cancel(Long userId) {
        if (userId == null) return;
        rateLimitService.check("match:cancel:" + userId, 12, Duration.ofMinutes(1), "取消匹配太频繁");
        QueueEntry entry = waiting.remove(userId);
        markCancelled(entry == null ? findWaitingQueueId(userId) : entry.queueId());
        presenceService.clearMatching(userId);
        lastResult.put(userId, new MatchmakingResult("CANCELLED", null, null, null, null));
    }

    public int queueCount(QueueType queueType) {
        int persisted = persistedQueueCount(queueType);
        if (persisted > 0) return persisted;
        return (int) waiting.values().stream().filter(item -> item.queueType() == queueType).count();
    }

    public Map<String, Object> clearQueueData() {
        int waitingRows = waiting.size();
        waiting.clear();
        lastResult.clear();
        presenceService.clearAllMatching();
        int cancelledRows = 0;
        try {
            if (matchQueueMapper != null) {
                cancelledRows = matchQueueMapper.update(null, new UpdateWrapper<MatchQueueEntity>()
                        .set("status", "CANCELLED")
                        .set("cancelled_at", LocalDateTime.now())
                        .set("updated_at", LocalDateTime.now())
                        .eq("status", "WAITING")
                        .eq("deleted", 0));
            }
        } catch (RuntimeException ignored) {
            cancelledRows = 0;
        }
        return Map.of("memoryWaiting", waitingRows, "cancelledQueues", cancelledRows);
    }

    private MatchmakingResult matchImmediately(Long userId, QueueType queueType, RoleType role) {
        RoomSnapshot room = roomService.createSystemRoom(userId, role == RoleType.DEER ? QueueType.DEER : queueType);
        MatchmakingResult result = MatchmakingResult.matched(room, room.currentMatchId(), role);
        lastResult.put(userId, result);
        return result;
    }

    private MatchmakingResult matchPair(Long wolfUserId, Long deerUserId) {
        RoomSnapshot room = roomService.createSystemRoom(List.of(
                new PlayerAssignment(wolfUserId, RoleType.WOLF),
                new PlayerAssignment(deerUserId, RoleType.DEER)
        ), 15);
        MatchmakingResult result = MatchmakingResult.matched(room, room.currentMatchId(), RoleType.WOLF);
        lastResult.put(wolfUserId, result);
        return result;
    }

    private Optional<QueueEntry> oldest(QueueType queueType) {
        return waiting.values().stream()
                .filter(item -> item.queueType() == queueType)
                .min(Comparator.comparing(QueueEntry::queuedAt));
    }

    private Long persistQueue(Long userId, QueueType queueType, String status, Long roomId, Long matchId) {
        try {
            if (matchQueueMapper == null) return null;
            LocalDateTime now = LocalDateTime.now();
            MatchQueueEntity entity = new MatchQueueEntity();
            entity.setId(Ids.nextId());
            entity.setUserId(userId);
            entity.setQueueType(queueType.name());
            entity.setPreferredRole(queueType.name());
            entity.setStatus(status);
            entity.setRoomId(roomId);
            entity.setMatchedRoomId(roomId);
            entity.setMatchedMatchId(matchId);
            if ("MATCHED".equals(status)) entity.setMatchedAt(now);
            if ("CANCELLED".equals(status)) entity.setCancelledAt(now);
            entity.setCreatedAt(now);
            entity.setUpdatedAt(now);
            entity.setDeleted(0);
            matchQueueMapper.insert(entity);
            return entity.getId();
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private void markMatched(Long queueId, MatchmakingResult result) {
        if (queueId == null || result == null) return;
        try {
            if (matchQueueMapper == null) return;
            MatchQueueEntity entity = matchQueueMapper.selectById(queueId);
            if (entity == null) return;
            entity.setStatus("MATCHED");
            entity.setMatchedRoomId(result.roomId() == null ? null : Long.valueOf(String.valueOf(result.roomId())));
            entity.setMatchedMatchId(result.matchId() == null ? null : Long.valueOf(String.valueOf(result.matchId())));
            entity.setMatchedAt(LocalDateTime.now());
            entity.setUpdatedAt(entity.getMatchedAt());
            matchQueueMapper.updateById(entity);
        } catch (RuntimeException ignored) {
            // Database persistence is best-effort in local development.
        }
    }

    private void markCancelled(Long queueId) {
        if (queueId == null) return;
        try {
            if (matchQueueMapper == null) return;
            MatchQueueEntity entity = matchQueueMapper.selectById(queueId);
            if (entity == null) return;
            entity.setStatus("CANCELLED");
            entity.setCancelledAt(LocalDateTime.now());
            entity.setUpdatedAt(entity.getCancelledAt());
            matchQueueMapper.updateById(entity);
        } catch (RuntimeException ignored) {
            // Database persistence is best-effort in local development.
        }
    }

    private boolean hasWaitingQueue(Long userId) {
        return findWaitingQueueId(userId) != null;
    }

    private Long findWaitingQueueId(Long userId) {
        try {
            if (matchQueueMapper == null) return null;
            MatchQueueEntity entity = matchQueueMapper.selectOne(new QueryWrapper<MatchQueueEntity>()
                    .eq("user_id", userId)
                    .eq("status", "WAITING")
                    .eq("deleted", 0)
                    .last("LIMIT 1"));
            return entity == null ? null : entity.getId();
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private int persistedQueueCount(QueueType queueType) {
        try {
            if (matchQueueMapper == null) return 0;
            return Math.toIntExact(matchQueueMapper.selectCount(new QueryWrapper<MatchQueueEntity>()
                    .eq("preferred_role", queueType.name())
                    .eq("status", "WAITING")
                    .eq("deleted", 0)));
        } catch (RuntimeException ignored) {
            return 0;
        }
    }

    private record QueueEntry(Long userId, QueueType queueType, Instant queuedAt, Long queueId) {
    }
}
