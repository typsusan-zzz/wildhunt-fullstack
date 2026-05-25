package com.wildhunt.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.common.util.Ids;
import com.wildhunt.dal.entity.DailyCheckinEntity;
import com.wildhunt.dal.mapper.DailyCheckinMapper;
import com.wildhunt.service.dto.CheckinAdminRecord;
import com.wildhunt.service.dto.CheckinConfig;
import com.wildhunt.service.dto.CheckinStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CheckinService {
    private static final String REWARD_CONFIG_KEY = "checkin.7day_rewards";
    private static final List<Integer> DEFAULT_REWARDS = List.of(50, 60, 70, 80, 90, 100, 180);

    private final UserService userService;
    private final UserAssetService userAssetService;
    private final NotificationService notificationService;
    private final SystemConfigService systemConfigService;
    private final DailyCheckinMapper dailyCheckinMapper;
    private final SeasonPassService seasonPassService;
    private final Map<Long, List<CheckinRecord>> fallbackCheckins = new ConcurrentHashMap<>();

    public CheckinService(UserService userService, UserAssetService userAssetService, NotificationService notificationService) {
        this(userService, userAssetService, notificationService, new SystemConfigService(), null, (DailyCheckinMapper) null);
    }

    @Autowired
    public CheckinService(UserService userService, UserAssetService userAssetService, NotificationService notificationService,
                          SystemConfigService systemConfigService, ObjectProvider<SeasonPassService> seasonPassService,
                          ObjectProvider<DailyCheckinMapper> dailyCheckinMapper) {
        this(userService, userAssetService, notificationService, systemConfigService,
                seasonPassService.getIfAvailable(), dailyCheckinMapper.getIfAvailable());
    }

    private CheckinService(UserService userService, UserAssetService userAssetService, NotificationService notificationService,
                           SystemConfigService systemConfigService, SeasonPassService seasonPassService,
                           DailyCheckinMapper dailyCheckinMapper) {
        this.userService = userService;
        this.userAssetService = userAssetService;
        this.notificationService = notificationService;
        this.systemConfigService = systemConfigService;
        this.seasonPassService = seasonPassService;
        this.dailyCheckinMapper = dailyCheckinMapper;
    }

    public CheckinStatus status(Long userId) {
        LocalDate today = LocalDate.now();
        List<CheckinRecord> records = records(userId, 400);
        boolean claimedToday = records.stream().anyMatch(item -> item.date.equals(today));
        int streak = currentStreak(records, claimedToday ? today : today.minusDays(1));
        return new CheckinStatus(claimedToday, streak, records.size(), rewards(records, today, rewardPlan()), today);
    }

    @Transactional
    public CheckinStatus claim(Long userId) {
        synchronized (lockKey(userId)) {
            LocalDate today = LocalDate.now();
            List<CheckinRecord> records = records(userId, 400);
            if (records.stream().anyMatch(item -> item.date.equals(today))) {
                throw new BizException(ErrorCode.REWARD_ALREADY_CLAIMED, "今日奖励已领取");
            }
            int streak = currentStreak(records, today.minusDays(1)) + 1;
            int rewardExp = rewardForStreak(streak);
            insertRecord(userId, today, streak, rewardExp);
            grantReward(userId, streak, rewardExp, "签到奖励到账");
            return status(userId);
        }
    }

    public List<CheckinStatus.RewardPreview> history(Long userId) {
        return rewards(records(userId, 400), LocalDate.now(), rewardPlan());
    }

    public CheckinConfig config() {
        return new CheckinConfig(rewardPlan());
    }

    public CheckinConfig updateConfig(List<Integer> rewards) {
        List<Integer> normalized = normalizeRewards(rewards);
        systemConfigService.set(REWARD_CONFIG_KEY, joinRewards(normalized));
        return new CheckinConfig(normalized);
    }

    public List<CheckinAdminRecord> adminRecords(Long userId, int limit) {
        return records(userId, limit).stream().map(CheckinService::toAdminRecord).toList();
    }

    @Transactional
    public CheckinAdminRecord adminGrant(Long userId, LocalDate checkinDate, Integer streakDays,
                                         Integer rewardExp, boolean grantReward) {
        LocalDate date = checkinDate == null ? LocalDate.now() : checkinDate;
        if (date.isAfter(LocalDate.now())) {
            throw new BizException(ErrorCode.BAD_REQUEST, "不能补签未来日期");
        }
        synchronized (lockKey(userId)) {
            List<CheckinRecord> records = records(userId, 400);
            if (records.stream().anyMatch(item -> item.date.equals(date))) {
                throw new BizException(ErrorCode.REWARD_ALREADY_CLAIMED, "该日期已签到");
            }
            int streak = streakDays == null || streakDays <= 0 ? currentStreak(records, date.minusDays(1)) + 1 : streakDays;
            int exp = rewardExp == null || rewardExp < 0 ? rewardForStreak(streak) : rewardExp;
            CheckinRecord record = insertRecord(userId, date, streak, exp);
            if (grantReward) grantReward(userId, streak, exp, "签到补签奖励到账");
            return toAdminRecord(record);
        }
    }

    @Transactional
    public Map<String, Object> resetUser(Long userId) {
        int removed = deleteUserRecords(userId);
        return Map.of("userId", userId, "removed", removed);
    }

    @Transactional
    public Map<String, Object> resetAll() {
        int removed = deleteAllRecords();
        return Map.of("removed", removed);
    }

    private List<CheckinRecord> records(Long userId, int limit) {
        int safeLimit = Math.max(1, Math.min(2000, limit));
        if (dailyCheckinMapper != null) {
            try {
                return dailyCheckinMapper.selectList(new QueryWrapper<DailyCheckinEntity>()
                                .eq("user_id", userId)
                                .eq("deleted", 0)
                                .orderByDesc("checkin_date")
                                .last("LIMIT " + safeLimit))
                        .stream()
                        .map(CheckinService::fromEntity)
                        .toList();
            } catch (RuntimeException ignored) {
                // Fall back to the in-memory path when MySQL is not available locally.
            }
        }
        return fallbackCheckins.getOrDefault(userId, List.of()).stream()
                .sorted(Comparator.comparing((CheckinRecord item) -> item.date).reversed())
                .limit(safeLimit)
                .toList();
    }

    private CheckinRecord insertRecord(Long userId, LocalDate date, int streakDays, int rewardExp) {
        CheckinRecord record = new CheckinRecord(Ids.nextId(), userId, date, streakDays, rewardExp,
                LocalDateTime.now(), LocalDateTime.now());
        if (dailyCheckinMapper != null) {
            try {
                DailyCheckinEntity duplicate = dailyCheckinMapper.selectOne(new QueryWrapper<DailyCheckinEntity>()
                        .eq("user_id", userId)
                        .eq("checkin_date", date)
                        .last("LIMIT 1"));
                if (duplicate != null && !Integer.valueOf(1).equals(duplicate.getDeleted())) {
                    throw new BizException(ErrorCode.REWARD_ALREADY_CLAIMED, "该日期已签到");
                }
                if (duplicate != null) {
                    duplicate.setStreakDays(streakDays);
                    duplicate.setRewardExp(rewardExp);
                    duplicate.setUpdatedAt(record.updatedAt);
                    duplicate.setDeleted(0);
                    dailyCheckinMapper.updateById(duplicate);
                    return new CheckinRecord(duplicate.getId(), userId, date, streakDays, rewardExp,
                            duplicate.getCreatedAt(), duplicate.getUpdatedAt());
                }
                DailyCheckinEntity entity = new DailyCheckinEntity();
                entity.setId(record.id);
                entity.setUserId(userId);
                entity.setCheckinDate(date);
                entity.setStreakDays(streakDays);
                entity.setRewardExp(rewardExp);
                entity.setCreatedAt(record.createdAt);
                entity.setUpdatedAt(record.updatedAt);
                entity.setDeleted(0);
                dailyCheckinMapper.insert(entity);
                return record;
            } catch (BizException error) {
                throw error;
            } catch (RuntimeException ignored) {
                // Fall back to the in-memory path when MySQL is not available locally.
            }
        }
        List<CheckinRecord> userRecords = fallbackCheckins.computeIfAbsent(userId, ignored -> new ArrayList<>());
        if (userRecords.stream().anyMatch(item -> item.date.equals(date))) {
            throw new BizException(ErrorCode.REWARD_ALREADY_CLAIMED, "该日期已签到");
        }
        userRecords.add(record);
        return record;
    }

    private int deleteUserRecords(Long userId) {
        List<CheckinRecord> removedRecords = fallbackCheckins.remove(userId);
        int fallbackRemoved = removedRecords == null ? 0 : removedRecords.size();
        if (dailyCheckinMapper == null) return fallbackRemoved;
        try {
            return dailyCheckinMapper.update(null, new UpdateWrapper<DailyCheckinEntity>()
                    .set("deleted", 1)
                    .set("updated_at", LocalDateTime.now())
                    .eq("user_id", userId)
                    .eq("deleted", 0));
        } catch (RuntimeException ignored) {
            return fallbackRemoved;
        }
    }

    private int deleteAllRecords() {
        int fallbackRemoved = fallbackCheckins.values().stream().mapToInt(List::size).sum();
        fallbackCheckins.clear();
        if (dailyCheckinMapper == null) return fallbackRemoved;
        try {
            return dailyCheckinMapper.update(null, new UpdateWrapper<DailyCheckinEntity>()
                    .set("deleted", 1)
                    .set("updated_at", LocalDateTime.now())
                    .eq("deleted", 0));
        } catch (RuntimeException ignored) {
            return fallbackRemoved;
        }
    }

    private void grantReward(Long userId, int streak, int rewardExp, String title) {
        userService.addExp(userId, rewardExp);
        if (seasonPassService != null) {
            seasonPassService.addExp(userId, rewardExp, "CHECKIN", "streak:" + streak);
        }
        if (streak > 0 && streak % rewardPlan().size() == 0) {
            userAssetService.grant(userId, "FRAME", "SEVEN_DAY_STREAK", "CHECKIN");
        }
        notificationService.push(userId, "ACTIVITY_REWARD", title,
                "获得 " + rewardExp + " 经验" + (streak % rewardPlan().size() == 0 ? " 和七日头像框" : ""),
                Map.of("exp", rewardExp, "streakDays", streak));
    }

    private List<Integer> rewardPlan() {
        String raw = systemConfigService.get(REWARD_CONFIG_KEY, joinRewards(DEFAULT_REWARDS));
        List<Integer> parsed = new ArrayList<>();
        for (String part : raw.split(",")) {
            try {
                int value = Integer.parseInt(part.trim());
                if (value >= 0) parsed.add(value);
            } catch (NumberFormatException ignored) {
                // Ignore broken config entries and fall back below if needed.
            }
        }
        return parsed.isEmpty() ? DEFAULT_REWARDS : List.copyOf(parsed);
    }

    private static List<Integer> normalizeRewards(List<Integer> rewards) {
        if (rewards == null || rewards.isEmpty() || rewards.size() > 31) {
            throw new BizException(ErrorCode.BAD_REQUEST, "签到奖励配置需要 1-31 个非负整数");
        }
        List<Integer> normalized = rewards.stream()
                .filter(Objects::nonNull)
                .map(value -> Math.max(0, Math.min(100000, value)))
                .toList();
        if (normalized.isEmpty()) {
            throw new BizException(ErrorCode.BAD_REQUEST, "签到奖励配置不能为空");
        }
        return normalized;
    }

    private int rewardForStreak(int streak) {
        List<Integer> plan = rewardPlan();
        return plan.get(Math.floorMod(streak - 1, plan.size()));
    }

    private static String joinRewards(List<Integer> rewards) {
        return String.join(",", rewards.stream().map(String::valueOf).toList());
    }

    private static int currentStreak(List<CheckinRecord> records, LocalDate endDate) {
        int streak = 0;
        LocalDate cursor = endDate;
        List<CheckinRecord> sorted = records.stream()
                .sorted(Comparator.comparing((CheckinRecord item) -> item.date).reversed())
                .toList();
        for (CheckinRecord record : sorted) {
            if (record.date.isAfter(cursor)) continue;
            if (record.date.equals(cursor)) {
                streak++;
                cursor = cursor.minusDays(1);
            } else if (record.date.isBefore(cursor)) {
                break;
            }
        }
        return streak;
    }

    private static List<CheckinStatus.RewardPreview> rewards(List<CheckinRecord> records, LocalDate today, List<Integer> rewardPlan) {
        boolean claimedToday = records.stream().anyMatch(item -> item.date.equals(today));
        int streak = currentStreak(records, claimedToday ? today : today.minusDays(1));
        int claimedInCycle = streak == 0 ? 0 : Math.floorMod(streak - 1, rewardPlan.size()) + 1;
        List<CheckinStatus.RewardPreview> result = new ArrayList<>();
        for (int day = 1; day <= rewardPlan.size(); day++) {
            result.add(new CheckinStatus.RewardPreview(day, rewardPlan.get(day - 1),
                    day == rewardPlan.size() ? "SEVEN_DAY_STREAK" : null,
                    day <= claimedInCycle));
        }
        return result;
    }

    private static CheckinRecord fromEntity(DailyCheckinEntity entity) {
        return new CheckinRecord(entity.getId(), entity.getUserId(), entity.getCheckinDate(),
                entity.getStreakDays() == null ? 1 : entity.getStreakDays(),
                entity.getRewardExp() == null ? 0 : entity.getRewardExp(),
                entity.getCreatedAt(), entity.getUpdatedAt());
    }

    private static CheckinAdminRecord toAdminRecord(CheckinRecord record) {
        return new CheckinAdminRecord(record.id, record.userId, record.date, record.streakDays,
                record.rewardExp, record.createdAt, record.updatedAt);
    }

    private static String lockKey(Long userId) {
        return ("checkin:" + userId).intern();
    }

    private record CheckinRecord(Long id, Long userId, LocalDate date, int streakDays, int rewardExp,
                                 LocalDateTime createdAt, LocalDateTime updatedAt) {
    }
}
