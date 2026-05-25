package com.wildhunt.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.common.util.Ids;
import com.wildhunt.dal.entity.ActivityClaimEntity;
import com.wildhunt.dal.entity.ActivityEntity;
import com.wildhunt.dal.mapper.ActivityClaimMapper;
import com.wildhunt.dal.mapper.ActivityMapper;
import com.wildhunt.service.dto.ActivityAdminRequest;
import com.wildhunt.service.dto.ActivityDto;
import com.wildhunt.service.dto.UserProfile;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivityService {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final UserService userService;
    private final UserAssetService userAssetService;
    private final NotificationService notificationService;
    private final FriendService friendService;
    private final SeasonPassService seasonPassService;
    private final ActivityMapper activityMapper;
    private final ActivityClaimMapper claimMapper;
    private final Map<Long, ActivityRecord> fallbackActivities = new ConcurrentHashMap<>();
    private final Map<Long, Set<Long>> fallbackClaims = new ConcurrentHashMap<>();

    public ActivityService(UserService userService, UserAssetService userAssetService, NotificationService notificationService) {
        this(userService, userAssetService, notificationService, new FriendService(userService),
                (SeasonPassService) null, (ActivityMapper) null, (ActivityClaimMapper) null);
    }

    @Autowired
    public ActivityService(UserService userService, UserAssetService userAssetService, NotificationService notificationService,
                           FriendService friendService, ObjectProvider<SeasonPassService> seasonPassService,
                           ObjectProvider<ActivityMapper> activityMapper, ObjectProvider<ActivityClaimMapper> claimMapper) {
        this(userService, userAssetService, notificationService, friendService,
                seasonPassService.getIfAvailable(), activityMapper.getIfAvailable(), claimMapper.getIfAvailable());
    }

    private ActivityService(UserService userService, UserAssetService userAssetService, NotificationService notificationService,
                            FriendService friendService, SeasonPassService seasonPassService,
                            ActivityMapper activityMapper, ActivityClaimMapper claimMapper) {
        this.userService = userService;
        this.userAssetService = userAssetService;
        this.notificationService = notificationService;
        this.friendService = friendService;
        this.seasonPassService = seasonPassService;
        this.activityMapper = activityMapper;
        this.claimMapper = claimMapper;
        defaultActivities().forEach(item -> fallbackActivities.put(item.id(), item));
    }

    public List<ActivityDto> list(Long userId) {
        return activityRecords(false).stream()
                .filter(this::visibleToPlayers)
                .sorted(Comparator.comparing(ActivityRecord::id))
                .map(item -> toDto(item, userId, claimedActivityIds(userId).contains(item.id())))
                .toList();
    }

    public List<ActivityDto> progress(Long userId) {
        return list(userId);
    }

    public List<ActivityDto> adminList() {
        return activityRecords(true).stream()
                .sorted(Comparator.comparing(ActivityRecord::id))
                .map(item -> toDto(item, 0L, false))
                .toList();
    }

    @Transactional
    public ActivityDto claim(Long userId, Long activityId) {
        synchronized (lockKey(userId)) {
            ActivityRecord activity = activityRecords(false).stream()
                    .filter(item -> item.id().equals(activityId))
                    .findFirst()
                    .orElseThrow(() -> new BizException(ErrorCode.NOT_FOUND, "activity not found"));
            ActivityDto dto = toDto(activity, userId, claimedActivityIds(userId).contains(activityId));
            if (dto.claimed()) {
                throw new BizException(ErrorCode.REWARD_ALREADY_CLAIMED, "activity reward already claimed");
            }
            if (!dto.claimable()) {
                throw new BizException(ErrorCode.BAD_REQUEST, "activity condition is not completed");
            }
            insertClaim(userId, activity);
            grantReward(userId, activity.reward(), "ACTIVITY", activity.code());
            notificationService.push(userId, "ACTIVITY_REWARD", activity.title() + " claimed",
                    "Activity reward has been added", Map.of("activityCode", activity.code(), "reward", activity.reward()));
            return toDto(activity, userId, true);
        }
    }

    @Transactional
    public ActivityDto create(ActivityAdminRequest request) {
        return saveActivity(null, request);
    }

    @Transactional
    public ActivityDto update(Long activityId, ActivityAdminRequest request) {
        if (activityId == null) {
            throw new BizException(ErrorCode.BAD_REQUEST, "activity id is required");
        }
        return saveActivity(activityId, request);
    }

    @Transactional
    public ActivityDto disable(Long activityId) {
        ActivityRecord current = findActivity(activityId);
        ActivityRecord disabled = new ActivityRecord(current.id(), current.code(), current.title(), current.description(),
                current.activityType(), current.conditionValue(), current.conditionText(), current.reward(),
                current.startsAt(), current.endsAt(), "DISABLED", current.createdAt(), LocalDateTime.now());
        persistActivity(disabled);
        fallbackActivities.put(disabled.id(), disabled);
        return toDto(disabled, 0L, false);
    }

    @Transactional
    public Map<String, Object> resetClaims(Long userId) {
        int removed = 0;
        if (userId == null) {
            removed = fallbackClaims.values().stream().mapToInt(Set::size).sum();
            fallbackClaims.clear();
        } else {
            Set<Long> claims = fallbackClaims.remove(userId);
            removed = claims == null ? 0 : claims.size();
        }
        if (claimMapper != null) {
            try {
                UpdateWrapper<ActivityClaimEntity> wrapper = new UpdateWrapper<ActivityClaimEntity>()
                        .set("deleted", 1)
                        .set("updated_at", LocalDateTime.now())
                        .eq("deleted", 0);
                if (userId != null) wrapper.eq("user_id", userId);
                removed = claimMapper.update(null, wrapper);
            } catch (RuntimeException ignored) {
                // Keep local mode writable.
            }
        }
        return userId == null ? Map.of("removed", removed) : Map.of("userId", userId, "removed", removed);
    }

    private ActivityDto saveActivity(Long activityId, ActivityAdminRequest request) {
        if (request == null) {
            throw new BizException(ErrorCode.BAD_REQUEST, "activity payload is required");
        }
        ActivityRecord old = activityId == null ? null : findActivity(activityId);
        LocalDateTime now = LocalDateTime.now();
        Long id = activityId == null ? Ids.nextId() : activityId;
        String code = cleanCode(blankToDefault(request.code(), old == null ? "ACTIVITY_" + id : old.code()));
        String type = normalizeType(blankToDefault(request.activityType(), old == null ? "LOGIN" : old.activityType()));
        int conditionValue = Math.max(1, request.conditionValue() == null
                ? old == null ? 1 : old.conditionValue()
                : request.conditionValue());
        String conditionText = blankToDefault(request.conditionText(),
                defaultConditionText(type, conditionValue));
        Map<String, Object> reward = normalizeReward(request.reward() == null
                ? old == null ? Map.of("exp", 100) : old.reward()
                : request.reward());
        ActivityRecord next = new ActivityRecord(id, code,
                blankToDefault(request.title(), old == null ? code : old.title()),
                blankToDefault(request.description(), old == null ? "" : old.description()),
                type, conditionValue, conditionText, reward,
                request.startsAt() == null ? old == null ? now.minusDays(1) : old.startsAt() : request.startsAt(),
                request.endsAt() == null ? old == null ? now.plusDays(365) : old.endsAt() : request.endsAt(),
                blankToDefault(request.status(), old == null ? "ACTIVE" : old.status()).toUpperCase(Locale.ROOT),
                old == null ? now : old.createdAt(), now);
        persistActivity(next);
        fallbackActivities.put(next.id(), next);
        return toDto(next, 0L, false);
    }

    private ActivityRecord findActivity(Long activityId) {
        return activityRecords(true).stream()
                .filter(item -> item.id().equals(activityId))
                .findFirst()
                .orElseThrow(() -> new BizException(ErrorCode.NOT_FOUND, "activity not found"));
    }

    private List<ActivityRecord> activityRecords(boolean includeDisabled) {
        if (activityMapper != null) {
            try {
                QueryWrapper<ActivityEntity> wrapper = new QueryWrapper<ActivityEntity>().eq("deleted", 0);
                if (!includeDisabled) wrapper.eq("status", "ACTIVE");
                List<ActivityRecord> rows = activityMapper.selectList(wrapper.orderByAsc("id")).stream()
                        .map(this::fromEntity)
                        .toList();
                if (!rows.isEmpty()) return rows;
            } catch (RuntimeException ignored) {
                // Fall back to seed records when MySQL is not available or not migrated yet.
            }
        }
        return fallbackActivities.values().stream()
                .filter(item -> includeDisabled || "ACTIVE".equals(item.status()))
                .sorted(Comparator.comparing(ActivityRecord::id))
                .toList();
    }

    private Set<Long> claimedActivityIds(Long userId) {
        if (claimMapper != null) {
            try {
                return claimMapper.selectList(new QueryWrapper<ActivityClaimEntity>()
                                .eq("user_id", userId)
                                .eq("deleted", 0))
                        .stream()
                        .map(ActivityClaimEntity::getActivityId)
                        .collect(java.util.stream.Collectors.toSet());
            } catch (RuntimeException ignored) {
                // Fall back to memory.
            }
        }
        return fallbackClaims.getOrDefault(userId, Set.of());
    }

    private void insertClaim(Long userId, ActivityRecord activity) {
        fallbackClaims.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(activity.id());
        if (claimMapper == null) return;
        try {
            LocalDateTime now = LocalDateTime.now();
            ActivityClaimEntity duplicate = claimMapper.selectOne(new QueryWrapper<ActivityClaimEntity>()
                    .eq("activity_id", activity.id())
                    .eq("user_id", userId)
                    .last("LIMIT 1"));
            if (duplicate != null && !Integer.valueOf(1).equals(duplicate.getDeleted())) {
                throw new BizException(ErrorCode.REWARD_ALREADY_CLAIMED, "activity reward already claimed");
            }
            ActivityClaimEntity entity = duplicate == null ? new ActivityClaimEntity() : duplicate;
            if (entity.getId() == null) {
                entity.setId(Ids.nextId());
                entity.setCreatedAt(now);
            }
            entity.setActivityId(activity.id());
            entity.setUserId(userId);
            entity.setRewardJson(toJson(activity.reward()));
            entity.setClaimedAt(now);
            entity.setUpdatedAt(now);
            entity.setDeleted(0);
            if (claimMapper.selectById(entity.getId()) == null) claimMapper.insert(entity);
            else claimMapper.updateById(entity);
        } catch (BizException error) {
            throw error;
        } catch (RuntimeException ignored) {
            // Keep local mode writable.
        }
    }

    private void persistActivity(ActivityRecord activity) {
        if (activityMapper == null) return;
        try {
            ActivityEntity entity = activityMapper.selectOne(new QueryWrapper<ActivityEntity>()
                    .eq("activity_code", activity.code())
                    .last("LIMIT 1"));
            if (entity == null) {
                entity = activity.id() == null ? null : activityMapper.selectById(activity.id());
            }
            if (entity == null) {
                entity = new ActivityEntity();
                entity.setId(activity.id());
                entity.setCreatedAt(activity.createdAt());
            }
            entity.setActivityCode(activity.code());
            entity.setTitle(activity.title());
            entity.setDescription(activity.description());
            entity.setActivityType(activity.activityType());
            entity.setConditionValue(activity.conditionValue());
            entity.setConditionText(activity.conditionText());
            entity.setRewardJson(toJson(activity.reward()));
            entity.setStartsAt(activity.startsAt());
            entity.setEndsAt(activity.endsAt());
            entity.setStatus(activity.status());
            entity.setUpdatedAt(activity.updatedAt());
            entity.setDeleted(0);
            if (activityMapper.selectById(entity.getId()) == null) activityMapper.insert(entity);
            else activityMapper.updateById(entity);
        } catch (RuntimeException ignored) {
            // Keep local mode writable.
        }
    }

    private ActivityDto toDto(ActivityRecord activity, Long userId, boolean claimed) {
        int progress = progressFor(userId, activity.activityType());
        boolean expired = isExpired(activity);
        boolean claimable = !claimed && !expired && "ACTIVE".equals(activity.status()) && progress >= activity.conditionValue();
        return new ActivityDto(activity.id(), activity.code(), activity.title(), activity.description(),
                activity.activityType(), activity.reward(), activity.conditionText(),
                progress, activity.conditionValue(), claimable, claimed, expired, activity.startsAt(), activity.endsAt());
    }

    private boolean visibleToPlayers(ActivityRecord activity) {
        return "ACTIVE".equals(activity.status()) && !isExpired(activity);
    }

    private boolean isExpired(ActivityRecord activity) {
        LocalDateTime now = LocalDateTime.now();
        return (activity.startsAt() != null && activity.startsAt().isAfter(now))
                || (activity.endsAt() != null && activity.endsAt().isBefore(now));
    }

    private int progressFor(Long userId, String activityType) {
        UserProfile profile = userService.getOrCreate(userId);
        return switch (normalizeType(activityType)) {
            case "MATCH_COMPLETE" -> profile.totalMatches();
            case "FRIEND_INVITE" -> friendService == null ? 0 : friendService.friendCount(userId);
            case "WIN_COUNT" -> profile.totalWins();
            case "TROPHY_COUNT" -> profile.trophies();
            default -> 1;
        };
    }

    private void grantReward(Long userId, Map<String, Object> reward, String sourceType, String sourceId) {
        Map<String, Object> normalized = normalizeReward(reward);
        int exp = number(normalized.get("exp"));
        if (exp > 0) {
            userService.addExp(userId, exp);
            if (seasonPassService != null) {
                seasonPassService.addExp(userId, exp, sourceType, sourceId);
            }
        }
        int trophies = number(normalized.get("trophies"));
        if (trophies != 0) {
            userService.addTrophies(userId, trophies);
        }
        Object assetType = normalized.get("assetType");
        Object assetCode = normalized.get("assetCode");
        if (assetType instanceof String type && assetCode instanceof String code) {
            userAssetService.grant(userId, type, code, sourceType);
        }
    }

    private ActivityRecord fromEntity(ActivityEntity entity) {
        String type = normalizeType(entity.getActivityType());
        int condition = entity.getConditionValue() == null ? 1 : Math.max(1, entity.getConditionValue());
        return new ActivityRecord(entity.getId(), entity.getActivityCode(), entity.getTitle(), entity.getDescription(),
                type, condition, blankToDefault(entity.getConditionText(), defaultConditionText(type, condition)),
                normalizeReward(fromJson(entity.getRewardJson())), entity.getStartsAt(), entity.getEndsAt(),
                blankToDefault(entity.getStatus(), "ACTIVE").toUpperCase(Locale.ROOT),
                entity.getCreatedAt(), entity.getUpdatedAt());
    }

    private static List<ActivityRecord> defaultActivities() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                new ActivityRecord(3001L, "WELCOME_2026", "荒野初猎礼", "登录即可领取经验和默认头像框。",
                        "LOGIN", 1, "登录领取", Map.of("exp", 200, "assetType", "FRAME", "assetCode", "FRAME_WOODLAND"),
                        now.minusDays(1), now.plusDays(365), "ACTIVE", now, now),
                new ActivityRecord(3002L, "FIRST_MATCH", "完成首场对局", "完成任意一场追猎后领取经验。",
                        "MATCH_COMPLETE", 1, "完成 1 场对局", Map.of("exp", 120),
                        now.minusDays(1), now.plusDays(365), "ACTIVE", now, now),
                new ActivityRecord(3003L, "FRIEND_ROOM", "好友同行", "添加 1 名好友后领取称号。",
                        "FRIEND_INVITE", 1, "添加 1 名好友", Map.of("assetType", "TITLE", "assetCode", "PACK_LEADER"),
                        now.minusDays(1), now.plusDays(365), "ACTIVE", now, now),
                new ActivityRecord(3004L, "FIRST_WIN", "首胜补给", "赢得 1 场对局领取奖杯补给。",
                        "WIN_COUNT", 1, "赢得 1 场对局", Map.of("trophies", 30, "exp", 80),
                        now.minusDays(1), now.plusDays(365), "ACTIVE", now, now)
        );
    }

    private static Map<String, Object> normalizeReward(Map<String, Object> reward) {
        Map<String, Object> normalized = new LinkedHashMap<>(reward == null ? Map.of() : reward);
        Object asset = normalized.get("asset");
        if (asset instanceof String token && !normalized.containsKey("assetType")) {
            String upper = token.toUpperCase(Locale.ROOT);
            if (upper.startsWith("FRAME_")) normalized.put("assetType", "FRAME");
            else if (upper.startsWith("TITLE_")) normalized.put("assetType", "TITLE");
            else if (upper.startsWith("AVATAR_")) normalized.put("assetType", "AVATAR");
            else normalized.put("assetType", "ITEM");
            normalized.put("assetCode", upper);
        }
        return Map.copyOf(normalized);
    }

    private static Map<String, Object> fromJson(String value) {
        try {
            return value == null || value.isBlank() ? Map.of() : JSON.readValue(value, MAP_TYPE);
        } catch (RuntimeException | java.io.IOException ignored) {
            return Map.of();
        }
    }

    private static String toJson(Map<String, Object> value) {
        try {
            return JSON.writeValueAsString(value == null ? Map.of() : value);
        } catch (RuntimeException | java.io.IOException ignored) {
            return "{}";
        }
    }

    private static int number(Object value) {
        if (value instanceof Number number) return number.intValue();
        if (value instanceof String text) {
            try {
                return Integer.parseInt(text.trim());
            } catch (NumberFormatException ignored) {
                return 0;
            }
        }
        return 0;
    }

    private static String defaultConditionText(String type, int value) {
        return switch (normalizeType(type)) {
            case "MATCH_COMPLETE" -> "完成 " + value + " 场对局";
            case "FRIEND_INVITE" -> "添加 " + value + " 名好友";
            case "WIN_COUNT" -> "赢得 " + value + " 场对局";
            case "TROPHY_COUNT" -> "奖杯达到 " + value;
            default -> "登录领取";
        };
    }

    private static String normalizeType(String value) {
        String type = blankToDefault(value, "LOGIN").trim().toUpperCase(Locale.ROOT);
        return switch (type) {
            case "MATCH_COMPLETE", "FRIEND_INVITE", "WIN_COUNT", "TROPHY_COUNT" -> type;
            default -> "LOGIN";
        };
    }

    private static String cleanCode(String value) {
        return blankToDefault(value, "ACTIVITY").trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_\\-]", "_");
    }

    private static String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private static String lockKey(Long userId) {
        return ("activity:" + userId).intern();
    }

    private record ActivityRecord(Long id, String code, String title, String description, String activityType,
                                  int conditionValue, String conditionText, Map<String, Object> reward,
                                  LocalDateTime startsAt, LocalDateTime endsAt, String status,
                                  LocalDateTime createdAt, LocalDateTime updatedAt) {
    }
}
