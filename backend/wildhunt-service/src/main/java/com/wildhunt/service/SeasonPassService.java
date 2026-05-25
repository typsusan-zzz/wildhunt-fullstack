package com.wildhunt.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.common.util.Ids;
import com.wildhunt.dal.entity.SeasonPassClaimEntity;
import com.wildhunt.dal.entity.SeasonPassProgressEntity;
import com.wildhunt.dal.mapper.SeasonPassClaimMapper;
import com.wildhunt.dal.mapper.SeasonPassProgressMapper;
import com.wildhunt.service.dto.SeasonPassConfig;
import com.wildhunt.service.dto.SeasonPassRewardDto;
import com.wildhunt.service.dto.SeasonPassStatus;
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
public class SeasonPassService {
    private static final int EXP_PER_LEVEL = 1000;
    private static final String SEASON_CODE_KEY = "season.pass.version";
    private static final String SEASON_NAME_KEY = "season.pass.name";
    private static final String MAX_LEVEL_KEY = "season.pass.max_level";
    private static final String FREE_REWARDS_KEY = "season.pass.free_rewards";
    private static final String PREMIUM_REWARDS_KEY = "season.pass.premium_rewards";
    private static final String DEFAULT_SEASON_CODE = "S1_FOREST";
    private static final String DEFAULT_SEASON_NAME = "S1 Forest Hunt";
    private static final String DEFAULT_FREE_REWARDS = "1:EXP_100,3:TROPHY_30,5:FRAME_PINE,10:TITLE_TRACKER,15:EXP_300";
    private static final String DEFAULT_PREMIUM_REWARDS = "1:AVATAR_WOLF,3:EXP_200,5:FRAME_MOON,10:TITLE_NIGHT_HUNTER,15:EMOTE_HOWL";
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final UserService userService;
    private final UserAssetService userAssetService;
    private final NotificationService notificationService;
    private final SystemConfigService systemConfigService;
    private final SeasonPassProgressMapper progressMapper;
    private final SeasonPassClaimMapper claimMapper;
    private final Map<String, ProgressRecord> fallbackProgress = new ConcurrentHashMap<>();
    private final Set<String> fallbackClaims = ConcurrentHashMap.newKeySet();

    public SeasonPassService(UserService userService, UserAssetService userAssetService,
                             NotificationService notificationService, SystemConfigService systemConfigService) {
        this(userService, userAssetService, notificationService, systemConfigService,
                (SeasonPassProgressMapper) null, (SeasonPassClaimMapper) null);
    }

    @Autowired
    public SeasonPassService(UserService userService, UserAssetService userAssetService,
                             NotificationService notificationService, SystemConfigService systemConfigService,
                             ObjectProvider<SeasonPassProgressMapper> progressMapper,
                             ObjectProvider<SeasonPassClaimMapper> claimMapper) {
        this(userService, userAssetService, notificationService, systemConfigService,
                progressMapper.getIfAvailable(), claimMapper.getIfAvailable());
    }

    private SeasonPassService(UserService userService, UserAssetService userAssetService,
                              NotificationService notificationService, SystemConfigService systemConfigService,
                              SeasonPassProgressMapper progressMapper, SeasonPassClaimMapper claimMapper) {
        this.userService = userService;
        this.userAssetService = userAssetService;
        this.notificationService = notificationService;
        this.systemConfigService = systemConfigService;
        this.progressMapper = progressMapper;
        this.claimMapper = claimMapper;
    }

    public SeasonPassStatus status(Long userId) {
        SeasonConfig config = currentConfig();
        ProgressRecord progress = loadProgress(userId, config);
        return toStatus(config, progress);
    }

    @Transactional
    public SeasonPassStatus addExp(Long userId, int expDelta, String sourceType, String sourceId) {
        if (expDelta <= 0) return status(userId);
        synchronized (lockKey(userId)) {
            SeasonConfig config = currentConfig();
            ProgressRecord before = loadProgress(userId, config);
            int nextExp = Math.max(0, before.exp() + expDelta);
            int nextLevel = levelForExp(nextExp, config.maxLevel());
            ProgressRecord after = new ProgressRecord(before.id(), userId, config.seasonCode(), nextExp, nextLevel,
                    before.premiumUnlocked(), before.createdAt(), LocalDateTime.now());
            saveProgress(after);
            if (nextLevel > before.level()) {
                notificationService.push(userId, "ACTIVITY_REWARD", "Season pass level up",
                        "Season pass reached Lv." + nextLevel,
                        Map.of("seasonCode", config.seasonCode(), "level", nextLevel, "sourceType", nullToBlank(sourceType),
                                "sourceId", nullToBlank(sourceId)));
            }
            return toStatus(config, after);
        }
    }

    @Transactional
    public SeasonPassStatus claimReward(Long userId, String track, int rewardLevel) {
        synchronized (lockKey(userId)) {
            SeasonConfig config = currentConfig();
            String normalizedTrack = normalizeTrack(track);
            ProgressRecord progress = loadProgress(userId, config);
            RewardDef reward = rewardsForTrack(config, normalizedTrack).stream()
                    .filter(item -> item.level() == rewardLevel)
                    .findFirst()
                    .orElseThrow(() -> new BizException(ErrorCode.NOT_FOUND, "season pass reward not found"));
            if ("PREMIUM".equals(normalizedTrack) && !progress.premiumUnlocked()) {
                throw new BizException(ErrorCode.BAD_REQUEST, "premium pass is locked");
            }
            if (progress.level() < reward.level()) {
                throw new BizException(ErrorCode.BAD_REQUEST, "season pass level is not enough");
            }
            if (isClaimed(userId, config.seasonCode(), normalizedTrack, reward.level())) {
                throw new BizException(ErrorCode.REWARD_ALREADY_CLAIMED, "season pass reward already claimed");
            }
            insertClaim(userId, config.seasonCode(), normalizedTrack, reward);
            grantReward(userId, reward.reward(), "SEASON_PASS", config.seasonCode() + ":" + normalizedTrack + ":" + reward.level());
            notificationService.push(userId, "ACTIVITY_REWARD", "Season pass reward claimed",
                    reward.label() + " has been added",
                    Map.of("seasonCode", config.seasonCode(), "track", normalizedTrack, "level", reward.level()));
            return status(userId);
        }
    }

    @Transactional
    public SeasonPassStatus unlockPremium(Long userId) {
        synchronized (lockKey(userId)) {
            SeasonConfig config = currentConfig();
            ProgressRecord old = loadProgress(userId, config);
            ProgressRecord next = new ProgressRecord(old.id(), userId, config.seasonCode(), old.exp(), old.level(),
                    true, old.createdAt(), LocalDateTime.now());
            saveProgress(next);
            return toStatus(config, next);
        }
    }

    public SeasonPassConfig config() {
        SeasonConfig config = currentConfig();
        return new SeasonPassConfig(config.seasonCode(), config.seasonName(), config.maxLevel(),
                toConfigRewards(config.freeRewards()), toConfigRewards(config.premiumRewards()));
    }

    public SeasonPassConfig updateConfig(SeasonPassConfig request) {
        if (request == null) {
            throw new BizException(ErrorCode.BAD_REQUEST, "season pass config is required");
        }
        String seasonCode = blankToDefault(request.seasonCode(), DEFAULT_SEASON_CODE);
        String seasonName = blankToDefault(request.seasonName(), DEFAULT_SEASON_NAME);
        int maxLevel = Math.max(1, Math.min(200, request.maxLevel()));
        List<SeasonPassConfig.SeasonPassConfigReward> free = normalizeConfigRewards(request.freeRewards(), "FREE");
        List<SeasonPassConfig.SeasonPassConfigReward> premium = normalizeConfigRewards(request.premiumRewards(), "PREMIUM");
        systemConfigService.set(SEASON_CODE_KEY, seasonCode);
        systemConfigService.set(SEASON_NAME_KEY, seasonName);
        systemConfigService.set(MAX_LEVEL_KEY, String.valueOf(maxLevel));
        systemConfigService.set(FREE_REWARDS_KEY, serializeConfigRewards(free));
        systemConfigService.set(PREMIUM_REWARDS_KEY, serializeConfigRewards(premium));
        return config();
    }

    @Transactional
    public Map<String, Object> adminGrantExp(Long userId, int exp, String reason) {
        SeasonPassStatus status = addExp(userId, Math.max(0, exp), "ADMIN", reason);
        return Map.of("userId", userId, "exp", exp, "level", status.level(), "seasonExp", status.exp());
    }

    @Transactional
    public Map<String, Object> resetUser(Long userId) {
        SeasonConfig config = currentConfig();
        fallbackProgress.remove(progressKey(config.seasonCode(), userId));
        fallbackClaims.removeIf(key -> key.startsWith(config.seasonCode() + ":" + userId + ":"));
        int progressRows = 0;
        int claimRows = 0;
        if (progressMapper != null) {
            try {
                progressRows = progressMapper.update(null, new UpdateWrapper<SeasonPassProgressEntity>()
                        .set("deleted", 1)
                        .set("updated_at", LocalDateTime.now())
                        .eq("user_id", userId)
                        .eq("season_code", config.seasonCode())
                        .eq("deleted", 0));
            } catch (RuntimeException ignored) {
                progressRows = 0;
            }
        }
        if (claimMapper != null) {
            try {
                claimRows = claimMapper.update(null, new UpdateWrapper<SeasonPassClaimEntity>()
                        .set("deleted", 1)
                        .set("updated_at", LocalDateTime.now())
                        .eq("user_id", userId)
                        .eq("season_code", config.seasonCode())
                        .eq("deleted", 0));
            } catch (RuntimeException ignored) {
                claimRows = 0;
            }
        }
        return Map.of("userId", userId, "progressRows", progressRows, "claimRows", claimRows);
    }

    private SeasonPassStatus toStatus(SeasonConfig config, ProgressRecord progress) {
        int expIntoLevel = config.maxLevel() <= progress.level() ? EXP_PER_LEVEL :
                Math.floorMod(progress.exp(), EXP_PER_LEVEL);
        int progressPercent = config.maxLevel() <= progress.level() ? 100 : (int) Math.floor(expIntoLevel * 100.0 / EXP_PER_LEVEL);
        return new SeasonPassStatus(config.seasonCode(), config.seasonName(), progress.level(), progress.exp(),
                expIntoLevel, config.maxLevel() <= progress.level() ? 0 : EXP_PER_LEVEL,
                Math.max(0, Math.min(100, progressPercent)), config.maxLevel(), progress.premiumUnlocked(),
                toRewardDtos(config, progress, "FREE", config.freeRewards()),
                toRewardDtos(config, progress, "PREMIUM", config.premiumRewards()));
    }

    private List<SeasonPassRewardDto> toRewardDtos(SeasonConfig config, ProgressRecord progress,
                                                   String track, List<RewardDef> rewards) {
        return rewards.stream()
                .sorted(Comparator.comparingInt(RewardDef::level))
                .map(reward -> {
                    boolean locked = "PREMIUM".equals(track) && !progress.premiumUnlocked();
                    boolean claimed = isClaimed(progress.userId(), config.seasonCode(), track, reward.level());
                    boolean claimable = !locked && !claimed && progress.level() >= reward.level();
                    return new SeasonPassRewardDto(track, reward.level(), reward.label(), reward.reward(),
                            claimable, claimed, locked);
                })
                .toList();
    }

    private ProgressRecord loadProgress(Long userId, SeasonConfig config) {
        if (progressMapper != null) {
            try {
                SeasonPassProgressEntity entity = progressMapper.selectOne(new QueryWrapper<SeasonPassProgressEntity>()
                        .eq("user_id", userId)
                        .eq("season_code", config.seasonCode())
                        .eq("deleted", 0)
                        .last("LIMIT 1"));
                if (entity != null) return fromEntity(entity, config.maxLevel());
            } catch (RuntimeException ignored) {
                // Keep the in-memory path available without MySQL.
            }
        }
        return fallbackProgress.getOrDefault(progressKey(config.seasonCode(), userId),
                new ProgressRecord(null, userId, config.seasonCode(), 0, 1, false, LocalDateTime.now(), LocalDateTime.now()));
    }

    private void saveProgress(ProgressRecord record) {
        fallbackProgress.put(progressKey(record.seasonCode(), record.userId()), record);
        if (progressMapper == null) return;
        try {
            LocalDateTime now = LocalDateTime.now();
            SeasonPassProgressEntity entity = progressMapper.selectOne(new QueryWrapper<SeasonPassProgressEntity>()
                    .eq("user_id", record.userId())
                    .eq("season_code", record.seasonCode())
                    .last("LIMIT 1"));
            if (entity == null) {
                entity = new SeasonPassProgressEntity();
                entity.setId(record.id() == null ? Ids.nextId() : record.id());
                entity.setUserId(record.userId());
                entity.setSeasonCode(record.seasonCode());
                entity.setCreatedAt(record.createdAt() == null ? now : record.createdAt());
            }
            entity.setSeasonExp(record.exp());
            entity.setLevel(record.level());
            entity.setPremiumUnlocked(record.premiumUnlocked() ? 1 : 0);
            entity.setUpdatedAt(now);
            entity.setDeleted(0);
            if (progressMapper.selectById(entity.getId()) == null) progressMapper.insert(entity);
            else progressMapper.updateById(entity);
        } catch (RuntimeException ignored) {
            // Keep local development mode writable.
        }
    }

    private boolean isClaimed(Long userId, String seasonCode, String track, int level) {
        String key = claimKey(seasonCode, userId, track, level);
        if (claimMapper != null) {
            try {
                SeasonPassClaimEntity row = claimMapper.selectOne(new QueryWrapper<SeasonPassClaimEntity>()
                        .eq("user_id", userId)
                        .eq("season_code", seasonCode)
                        .eq("reward_track", track)
                        .eq("reward_level", level)
                        .eq("deleted", 0)
                        .last("LIMIT 1"));
                if (row != null) return true;
            } catch (RuntimeException ignored) {
                // Fall through to in-memory claims.
            }
        }
        return fallbackClaims.contains(key);
    }

    private void insertClaim(Long userId, String seasonCode, String track, RewardDef reward) {
        fallbackClaims.add(claimKey(seasonCode, userId, track, reward.level()));
        if (claimMapper == null) return;
        try {
            LocalDateTime now = LocalDateTime.now();
            SeasonPassClaimEntity entity = claimMapper.selectOne(new QueryWrapper<SeasonPassClaimEntity>()
                    .eq("user_id", userId)
                    .eq("season_code", seasonCode)
                    .eq("reward_track", track)
                    .eq("reward_level", reward.level())
                    .last("LIMIT 1"));
            if (entity == null) {
                entity = new SeasonPassClaimEntity();
                entity.setId(Ids.nextId());
                entity.setUserId(userId);
                entity.setSeasonCode(seasonCode);
                entity.setRewardTrack(track);
                entity.setRewardLevel(reward.level());
                entity.setCreatedAt(now);
            }
            entity.setRewardJson(toJson(reward.reward()));
            entity.setClaimedAt(now);
            entity.setUpdatedAt(now);
            entity.setDeleted(0);
            if (claimMapper.selectById(entity.getId()) == null) claimMapper.insert(entity);
            else claimMapper.updateById(entity);
        } catch (RuntimeException ignored) {
            // Keep local development mode writable.
        }
    }

    private void grantReward(Long userId, Map<String, Object> reward, String sourceType, String sourceId) {
        Object exp = reward.get("exp");
        if (exp instanceof Number number && number.intValue() > 0) {
            userService.addExp(userId, number.intValue());
        }
        Object trophies = reward.get("trophies");
        if (trophies instanceof Number number && number.intValue() != 0) {
            userService.addTrophies(userId, number.intValue());
        }
        Object assetType = reward.get("assetType");
        Object assetCode = reward.get("assetCode");
        if (assetType instanceof String type && assetCode instanceof String code) {
            userAssetService.grant(userId, type, code, sourceType);
        }
    }

    private SeasonConfig currentConfig() {
        String seasonCode = blankToDefault(systemConfigService.get(SEASON_CODE_KEY, DEFAULT_SEASON_CODE), DEFAULT_SEASON_CODE);
        String seasonName = blankToDefault(systemConfigService.get(SEASON_NAME_KEY, DEFAULT_SEASON_NAME), DEFAULT_SEASON_NAME);
        int maxLevel = parseInt(systemConfigService.get(MAX_LEVEL_KEY, "50"), 50);
        maxLevel = Math.max(1, Math.min(200, maxLevel));
        List<RewardDef> free = parseRewards("FREE", systemConfigService.get(FREE_REWARDS_KEY, DEFAULT_FREE_REWARDS));
        List<RewardDef> premium = parseRewards("PREMIUM", systemConfigService.get(PREMIUM_REWARDS_KEY, DEFAULT_PREMIUM_REWARDS));
        return new SeasonConfig(seasonCode, seasonName, maxLevel, free, premium);
    }

    private List<RewardDef> parseRewards(String track, String raw) {
        List<RewardDef> result = new ArrayList<>();
        for (String item : blankToDefault(raw, "").split(",")) {
            if (item.isBlank() || !item.contains(":")) continue;
            String[] parts = item.split(":", 2);
            int level = parseInt(parts[0], 0);
            String token = parts[1].trim();
            if (level <= 0 || token.isBlank()) continue;
            result.add(new RewardDef(track, level, token, labelForToken(token), rewardForToken(token)));
        }
        if (!result.isEmpty()) return result;
        return parseRewards(track, "FREE".equals(track) ? DEFAULT_FREE_REWARDS : DEFAULT_PREMIUM_REWARDS);
    }

    private static List<SeasonPassConfig.SeasonPassConfigReward> toConfigRewards(List<RewardDef> rewards) {
        return rewards.stream()
                .sorted(Comparator.comparingInt(RewardDef::level))
                .map(reward -> new SeasonPassConfig.SeasonPassConfigReward(reward.level(), reward.token(), reward.label()))
                .toList();
    }

    private static List<SeasonPassConfig.SeasonPassConfigReward> normalizeConfigRewards(
            List<SeasonPassConfig.SeasonPassConfigReward> rewards, String track) {
        if (rewards == null || rewards.isEmpty()) {
            throw new BizException(ErrorCode.BAD_REQUEST, track + " rewards cannot be empty");
        }
        return rewards.stream()
                .filter(Objects::nonNull)
                .map(item -> new SeasonPassConfig.SeasonPassConfigReward(
                        Math.max(1, Math.min(200, item.level())),
                        blankToDefault(item.token(), "EXP_100").trim().toUpperCase(Locale.ROOT),
                        item.label()))
                .sorted(Comparator.comparingInt(SeasonPassConfig.SeasonPassConfigReward::level))
                .toList();
    }

    private static String serializeConfigRewards(List<SeasonPassConfig.SeasonPassConfigReward> rewards) {
        return String.join(",", rewards.stream()
                .map(item -> item.level() + ":" + item.token())
                .toList());
    }

    private static List<RewardDef> rewardsForTrack(SeasonConfig config, String track) {
        return "PREMIUM".equals(track) ? config.premiumRewards() : config.freeRewards();
    }

    private static Map<String, Object> rewardForToken(String token) {
        String normalized = token.trim().toUpperCase(Locale.ROOT);
        if (normalized.startsWith("EXP_")) {
            return Map.of("exp", parseInt(normalized.substring(4), 0));
        }
        if (normalized.startsWith("TROPHY_")) {
            return Map.of("trophies", parseInt(normalized.substring(7), 0));
        }
        if (normalized.startsWith("FRAME_")) {
            return Map.of("assetType", "FRAME", "assetCode", normalized);
        }
        if (normalized.startsWith("TITLE_")) {
            return Map.of("assetType", "TITLE", "assetCode", normalized);
        }
        if (normalized.startsWith("AVATAR_")) {
            return Map.of("assetType", "AVATAR", "assetCode", normalized);
        }
        if (normalized.startsWith("EMOTE_")) {
            return Map.of("assetType", "EMOTE", "assetCode", normalized);
        }
        return Map.of("assetType", "ITEM", "assetCode", normalized);
    }

    private static String labelForToken(String token) {
        String normalized = token.trim().toUpperCase(Locale.ROOT);
        if (normalized.startsWith("EXP_")) return "+" + parseInt(normalized.substring(4), 0) + " EXP";
        if (normalized.startsWith("TROPHY_")) return "+" + parseInt(normalized.substring(7), 0) + " trophies";
        if (normalized.startsWith("FRAME_")) return "Frame " + normalized.substring(6);
        if (normalized.startsWith("TITLE_")) return "Title " + normalized.substring(6);
        if (normalized.startsWith("AVATAR_")) return "Avatar " + normalized.substring(7);
        if (normalized.startsWith("EMOTE_")) return "Emote " + normalized.substring(6);
        return normalized;
    }

    private static ProgressRecord fromEntity(SeasonPassProgressEntity entity, int maxLevel) {
        int exp = Math.max(0, entity.getSeasonExp() == null ? 0 : entity.getSeasonExp());
        return new ProgressRecord(entity.getId(), entity.getUserId(), entity.getSeasonCode(), exp,
                Math.max(1, Math.min(maxLevel, entity.getLevel() == null ? levelForExp(exp, maxLevel) : entity.getLevel())),
                Integer.valueOf(1).equals(entity.getPremiumUnlocked()), entity.getCreatedAt(), entity.getUpdatedAt());
    }

    private static int levelForExp(int exp, int maxLevel) {
        return Math.max(1, Math.min(maxLevel, exp / EXP_PER_LEVEL + 1));
    }

    private static String normalizeTrack(String track) {
        String value = blankToDefault(track, "FREE").trim().toUpperCase(Locale.ROOT);
        if (!"FREE".equals(value) && !"PREMIUM".equals(value)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "invalid season pass track");
        }
        return value;
    }

    private static int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value == null ? "" : value.trim());
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private static String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private static String nullToBlank(String value) {
        return value == null ? "" : value;
    }

    private static String toJson(Map<String, Object> value) {
        try {
            return JSON.writeValueAsString(value == null ? Map.of() : value);
        } catch (RuntimeException | java.io.IOException ignored) {
            return "{}";
        }
    }

    @SuppressWarnings("unused")
    private static Map<String, Object> fromJson(String value) {
        try {
            return value == null || value.isBlank() ? Map.of() : JSON.readValue(value, MAP_TYPE);
        } catch (RuntimeException | java.io.IOException ignored) {
            return Map.of();
        }
    }

    private static String progressKey(String seasonCode, Long userId) {
        return seasonCode + ":" + userId;
    }

    private static String claimKey(String seasonCode, Long userId, String track, int level) {
        return seasonCode + ":" + userId + ":" + track + ":" + level;
    }

    private static String lockKey(Long userId) {
        return ("season-pass:" + userId).intern();
    }

    private record SeasonConfig(String seasonCode, String seasonName, int maxLevel,
                                List<RewardDef> freeRewards, List<RewardDef> premiumRewards) {
    }

    private record RewardDef(String track, int level, String token, String label, Map<String, Object> reward) {
    }

    private record ProgressRecord(Long id, Long userId, String seasonCode, int exp, int level,
                                  boolean premiumUnlocked, LocalDateTime createdAt, LocalDateTime updatedAt) {
    }
}
