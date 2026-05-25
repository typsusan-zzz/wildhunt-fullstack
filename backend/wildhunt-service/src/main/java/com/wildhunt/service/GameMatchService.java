package com.wildhunt.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.wildhunt.common.constant.GameConstants;
import com.wildhunt.common.enums.RoleType;
import com.wildhunt.common.util.Ids;
import com.wildhunt.dal.entity.GameMatchEntity;
import com.wildhunt.dal.entity.MatchPlayerEntity;
import com.wildhunt.dal.mapper.GameMatchMapper;
import com.wildhunt.dal.mapper.MatchPlayerMapper;
import com.wildhunt.service.dto.MatchSnapshot;
import com.wildhunt.service.dto.UserProfile;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GameMatchService {
    private final UserService userService;
    private final GameMatchMapper gameMatchMapper;
    private final MatchPlayerMapper matchPlayerMapper;
    private final SystemConfigService systemConfigService;
    private final SeasonPassService seasonPassService;
    private final PlayerPresenceService presenceService;
    private final Map<Long, MatchSnapshot> matches = new ConcurrentHashMap<>();
    private final Map<Long, Long> currentMatchByUser = new ConcurrentHashMap<>();
    private final Map<Long, RuntimeMatch> runtimeMatches = new ConcurrentHashMap<>();

    public GameMatchService() {
        this(new UserService(), null, null, new SystemConfigService(), null, new PlayerPresenceService());
    }

    public GameMatchService(UserService userService) {
        this(userService, null, null, new SystemConfigService(), null, new PlayerPresenceService());
    }

    @Autowired
    public GameMatchService(UserService userService, ObjectProvider<GameMatchMapper> gameMatchMapper,
                            ObjectProvider<MatchPlayerMapper> matchPlayerMapper,
                            ObjectProvider<SystemConfigService> systemConfigService,
                            ObjectProvider<SeasonPassService> seasonPassService,
                            ObjectProvider<PlayerPresenceService> presenceService) {
        this(userService, gameMatchMapper.getIfAvailable(), matchPlayerMapper.getIfAvailable(),
                systemConfigService.getIfAvailable(SystemConfigService::new), seasonPassService.getIfAvailable(),
                presenceService.getIfAvailable(PlayerPresenceService::new));
    }

    private GameMatchService(UserService userService, GameMatchMapper gameMatchMapper, MatchPlayerMapper matchPlayerMapper,
                             SystemConfigService systemConfigService, SeasonPassService seasonPassService,
                             PlayerPresenceService presenceService) {
        this.userService = userService;
        this.gameMatchMapper = gameMatchMapper;
        this.matchPlayerMapper = matchPlayerMapper;
        this.systemConfigService = systemConfigService;
        this.seasonPassService = seasonPassService;
        this.presenceService = presenceService;
    }

    @Transactional
    public MatchSnapshot createMatch(Long roomId, List<PlayerAssignment> assignments, int aiDeerCount) {
        long matchId = Ids.nextId();
        long seed = Math.abs((roomId == null ? 0 : roomId) * 31 + matchId);
        List<MatchSnapshot.Player> players = new ArrayList<>();
        for (PlayerAssignment assignment : assignments) {
            UserProfile profile = userService.getOrCreate(assignment.userId());
            players.add(new MatchSnapshot.Player(assignment.userId(), profile.nickname(), assignment.roleType(), false));
            currentMatchByUser.put(assignment.userId(), matchId);
        }
        boolean hasRealWolf = assignments.stream().anyMatch(item -> item.roleType() == RoleType.WOLF);
        if (!hasRealWolf) {
            players.add(new MatchSnapshot.Player(-100_001L, "AI Wolf", RoleType.WOLF, true));
        }
        for (int i = 0; i < Math.max(0, aiDeerCount); i++) {
            players.add(new MatchSnapshot.Player(-(long) i - 1, "AI Deer " + (i + 1), RoleType.DEER, true));
        }
        int targetDeerCount = targetDeerCount(assignments, hasRealWolf);
        MatchSnapshot snapshot = new MatchSnapshot(matchId, roomId, "PLAYING", seed,
                defaultConfig(assignments, aiDeerCount, targetDeerCount), players);
        matches.put(matchId, snapshot);
        runtimeMatches.put(matchId, RuntimeMatch.create(snapshot, targetDeerCount));
        persistMatch(snapshot, assignments, aiDeerCount);
        return snapshot;
    }

    public MatchSnapshot current(Long userId) {
        Long matchId = currentMatchByUser.get(userId);
        if (matchId == null) matchId = persistedCurrentMatchId(userId);
        if (matchId == null) return null;
        MatchSnapshot snapshot = matches.get(matchId);
        if (snapshot == null) snapshot = loadPersistedMatch(matchId);
        return snapshot;
    }

    public MatchSnapshot get(Long matchId) {
        return matches.get(matchId);
    }

    public GameRealtimeUpdate applyInput(Long matchId, Long userId, Map<String, Object> input) {
        MatchSnapshot snapshot = matches.get(matchId);
        if (snapshot == null) snapshot = loadPersistedMatch(matchId);
        if (snapshot == null || userId == null) return GameRealtimeUpdate.empty();
        MatchSnapshot currentSnapshot = snapshot;
        RuntimeMatch runtime = runtimeMatches.computeIfAbsent(matchId,
                ignored -> RuntimeMatch.create(currentSnapshot, configInt(currentSnapshot.gameConfig(), "realDeerCount", 1)));
        GameRealtimeUpdate update;
        synchronized (runtime) {
            update = runtime.apply(userId, input == null ? Map.of() : input, currentSnapshot.gameConfig());
        }
        if (update.matchEnded()) {
            settle(matchId, update.wolfWin());
        }
        return update;
    }

    @Transactional
    public MatchSnapshot leaveCurrent(Long userId) {
        if (userId == null) return null;
        MatchSnapshot snapshot = current(userId);
        if (snapshot == null) {
            presenceService.clearPlaying(userId);
            return null;
        }
        if ("FINISHED".equals(snapshot.status())) {
            currentMatchByUser.remove(userId);
            presenceService.clearPlaying(userId);
            return snapshot;
        }
        MatchSnapshot.Player leaving = snapshot.players().stream()
                .filter(player -> !player.ai() && player.userId().equals(userId))
                .findFirst()
                .orElse(null);
        if (leaving == null) {
            currentMatchByUser.remove(userId);
            presenceService.clearPlaying(userId);
            return snapshot;
        }
        boolean wolfWin = leaving.roleType() != RoleType.WOLF;
        settle(snapshot.matchId(), wolfWin);
        return matches.get(snapshot.matchId());
    }

    @Transactional
    public void settle(Long matchId, boolean wolfWin) {
        MatchSnapshot snapshot = matches.get(matchId);
        if (snapshot == null || "FINISHED".equals(snapshot.status())) return;
        for (MatchSnapshot.Player player : snapshot.players().stream().filter(item -> !item.ai()).toList()) {
            boolean win = (player.roleType() == RoleType.WOLF) == wolfWin;
            int expDelta = win ? 60 : 20;
            int trophyDelta = win ? 30 : -10;
            userService.recordMatch(player.userId(), win, expDelta, trophyDelta);
            if (seasonPassService != null) {
                seasonPassService.addExp(player.userId(), expDelta, "MATCH", String.valueOf(matchId));
            }
            currentMatchByUser.remove(player.userId());
            presenceService.clearPlaying(player.userId());
            persistPlayerResult(matchId, player.userId(), win, expDelta, trophyDelta);
        }
        MatchSnapshot finished = new MatchSnapshot(snapshot.matchId(), snapshot.roomId(), "FINISHED",
                snapshot.matchSeed(), snapshot.gameConfig(), snapshot.players().stream()
                .sorted(Comparator.comparing(MatchSnapshot.Player::ai).thenComparing(MatchSnapshot.Player::nickname))
                .toList());
        matches.put(matchId, finished);
        persistMatchStatus(matchId, "FINISHED");
    }

    public void clearRuntime() {
        matches.clear();
        currentMatchByUser.clear();
        runtimeMatches.clear();
    }

    private void persistMatch(MatchSnapshot snapshot, List<PlayerAssignment> assignments, int aiDeerCount) {
        try {
            if (gameMatchMapper == null) return;
            LocalDateTime now = LocalDateTime.now();
            GameMatchEntity entity = new GameMatchEntity();
            entity.setId(snapshot.matchId());
            entity.setRoomId(snapshot.roomId());
            entity.setStatus(snapshot.status());
            entity.setWolfUserId(assignments.stream()
                    .filter(item -> item.roleType() == RoleType.WOLF)
                    .map(PlayerAssignment::userId)
                    .findFirst()
                    .orElse(null));
            entity.setAiDeerCount(aiDeerCount);
            entity.setCreatedAt(now);
            entity.setUpdatedAt(now);
            entity.setDeleted(0);
            gameMatchMapper.insert(entity);
            persistPlayers(snapshot, assignments);
        } catch (RuntimeException ignored) {
            // Keep local development playable without MySQL.
        }
    }

    private void persistPlayers(MatchSnapshot snapshot, List<PlayerAssignment> assignments) {
        try {
            if (matchPlayerMapper == null) return;
            LocalDateTime now = LocalDateTime.now();
            for (PlayerAssignment assignment : assignments) {
                MatchPlayerEntity entity = new MatchPlayerEntity();
                entity.setId(Ids.nextId());
                entity.setMatchId(snapshot.matchId());
                entity.setUserId(assignment.userId());
                entity.setRoleType(assignment.roleType().name());
                entity.setResult("PLAYING");
                entity.setScoreDelta(0);
                entity.setExpDelta(0);
                entity.setTrophyDelta(0);
                entity.setSurvived(0);
                entity.setKillCount(0);
                entity.setFoodEaten(0);
                entity.setSkillUseCount(0);
                entity.setCreatedAt(now);
                entity.setUpdatedAt(now);
                entity.setDeleted(0);
                matchPlayerMapper.insert(entity);
            }
        } catch (RuntimeException ignored) {
            // Keep local development playable without MySQL.
        }
    }

    private Long persistedCurrentMatchId(Long userId) {
        try {
            if (matchPlayerMapper == null) return null;
            MatchPlayerEntity player = matchPlayerMapper.selectOne(new QueryWrapper<MatchPlayerEntity>()
                    .eq("user_id", userId)
                    .eq("result", "PLAYING")
                    .eq("deleted", 0)
                    .orderByDesc("created_at")
                    .last("LIMIT 1"));
            return player == null ? null : player.getMatchId();
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private MatchSnapshot loadPersistedMatch(Long matchId) {
        try {
            if (gameMatchMapper == null || matchPlayerMapper == null) return null;
            GameMatchEntity match = gameMatchMapper.selectById(matchId);
            if (match == null || Integer.valueOf(1).equals(match.getDeleted())) return null;
            List<MatchPlayerEntity> rows = matchPlayerMapper.selectList(new QueryWrapper<MatchPlayerEntity>()
                    .eq("match_id", matchId)
                    .eq("deleted", 0));
            List<PlayerAssignment> assignments = rows.stream()
                    .map(row -> new PlayerAssignment(row.getUserId(), RoleType.valueOf(row.getRoleType())))
                    .toList();
            List<MatchSnapshot.Player> players = new ArrayList<>(rows.stream()
                    .map(row -> new MatchSnapshot.Player(row.getUserId(), userService.getOrCreate(row.getUserId()).nickname(),
                            RoleType.valueOf(row.getRoleType()), false))
                    .toList());
            boolean hasRealWolf = assignments.stream().anyMatch(row -> row.roleType() == RoleType.WOLF);
            int aiDeerCount = match.getAiDeerCount() == null ? GameConstants.DEFAULT_AI_DEER_COUNT : match.getAiDeerCount();
            if (!hasRealWolf) {
                players.add(new MatchSnapshot.Player(-100_001L, "AI Wolf", RoleType.WOLF, true));
            }
            for (int i = 0; i < Math.max(0, aiDeerCount); i++) {
                players.add(new MatchSnapshot.Player(-(long) i - 1, "AI Deer " + (i + 1), RoleType.DEER, true));
            }
            int targetDeerCount = targetDeerCount(assignments, hasRealWolf);
            MatchSnapshot snapshot = new MatchSnapshot(matchId, match.getRoomId(), match.getStatus(),
                    Math.abs((match.getRoomId() == null ? 0 : match.getRoomId()) * 31 + matchId),
                    defaultConfig(assignments, aiDeerCount, targetDeerCount),
                    players);
            matches.put(matchId, snapshot);
            runtimeMatches.put(matchId, RuntimeMatch.create(snapshot, targetDeerCount));
            return snapshot;
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private void persistPlayerResult(Long matchId, Long userId, boolean win, int expDelta, int trophyDelta) {
        try {
            if (matchPlayerMapper == null) return;
            MatchPlayerEntity entity = matchPlayerMapper.selectOne(new QueryWrapper<MatchPlayerEntity>()
                    .eq("match_id", matchId)
                    .eq("user_id", userId)
                    .last("LIMIT 1"));
            if (entity == null) return;
            entity.setResult(win ? "WIN" : "LOSE");
            entity.setExpDelta(expDelta);
            entity.setTrophyDelta(trophyDelta);
            entity.setUpdatedAt(LocalDateTime.now());
            matchPlayerMapper.updateById(entity);
        } catch (RuntimeException ignored) {
            // Keep local development playable without MySQL.
        }
    }

    private void persistMatchStatus(Long matchId, String status) {
        try {
            if (gameMatchMapper == null) return;
            GameMatchEntity entity = gameMatchMapper.selectById(matchId);
            if (entity == null) return;
            entity.setStatus(status);
            entity.setUpdatedAt(LocalDateTime.now());
            gameMatchMapper.updateById(entity);
        } catch (RuntimeException ignored) {
            // Keep local development playable without MySQL.
        }
    }

    private Map<String, Object> defaultConfig(List<PlayerAssignment> assignments, int aiDeerCount, int targetDeerCount) {
        long realDeer = assignments.stream().filter(item -> item.roleType() == RoleType.DEER).count();
        int visibleTargets = Math.max(targetDeerCount, (int) realDeer);
        return systemConfigService.gameRuntimeConfig(visibleTargets, Math.max(GameConstants.DEFAULT_AI_DEER_COUNT, aiDeerCount));
    }

    private static int targetDeerCount(List<PlayerAssignment> assignments, boolean hasRealWolf) {
        long realDeer = assignments.stream().filter(item -> item.roleType() == RoleType.DEER).count();
        if (realDeer > 0) return (int) realDeer;
        return hasRealWolf ? 4 : 1;
    }

    private static int configInt(Map<String, Object> config, String key, int fallback) {
        Object value = config.get(key);
        if (value instanceof Number number) return number.intValue();
        try {
            return value == null ? fallback : Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private static double configDouble(Map<String, Object> config, String key, double fallback) {
        Object value = config.get(key);
        if (value instanceof Number number) return number.doubleValue();
        try {
            return value == null ? fallback : Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    public record GameRealtimeUpdate(Map<String, Object> snapshot, boolean matchEnded, boolean wolfWin) {
        static GameRealtimeUpdate empty() {
            return new GameRealtimeUpdate(Map.of(), false, false);
        }
    }

    public record PlayerAssignment(Long userId, RoleType roleType) {
    }

    private static final class RuntimeMatch {
        private final long startedAtMs = System.currentTimeMillis();
        private final Map<Long, RuntimePlayer> players = new ConcurrentHashMap<>();
        private final java.util.Set<Long> targetDeer = ConcurrentHashMap.newKeySet();
        private final java.util.Set<Long> deadTargets = ConcurrentHashMap.newKeySet();
        private volatile boolean ended;
        private volatile boolean wolfWin;
        private int mistakes;

        static RuntimeMatch create(MatchSnapshot snapshot, int targetDeerCount) {
            RuntimeMatch runtime = new RuntimeMatch();
            int deerTargets = 0;
            int index = 0;
            for (MatchSnapshot.Player player : snapshot.players()) {
                RuntimePlayer state = RuntimePlayer.spawn(player, index++);
                runtime.players.put(player.userId(), state);
                if (player.roleType() == RoleType.DEER && deerTargets < targetDeerCount) {
                    runtime.targetDeer.add(player.userId());
                    deerTargets++;
                }
            }
            return runtime;
        }

        GameRealtimeUpdate apply(Long userId, Map<String, Object> input, Map<String, Object> config) {
            RuntimePlayer player = players.get(userId);
            if (player == null || ended) return new GameRealtimeUpdate(snapshot(config, Map.of()), ended, wolfWin);
            double dt = 0.05;
            double turn = bool(input, "right") ? -1 : bool(input, "left") ? 1 : 0;
            player.yaw += turn * configDouble(config, "turnSpeed", 2.65) * dt;
            double move = bool(input, "forward") ? 1 : bool(input, "back") ? -0.56 : 0;
            double baseSpeed = player.role == RoleType.WOLF
                    ? configDouble(config, "wolfBaseSpeed", 13)
                    : configDouble(config, "deerBaseSpeed", 7);
            double sprintSpeed = player.role == RoleType.WOLF
                    ? configDouble(config, "wolfSprintSpeed", 22)
                    : configDouble(config, "deerSprintSpeed", 11.2);
            double speed = bool(input, "sprint") ? sprintSpeed : baseSpeed;
            player.x += Math.sin(player.yaw) * speed * move * dt;
            player.z += Math.cos(player.yaw) * speed * move * dt;
            double arena = configDouble(config, "arenaRadius", 142);
            double distance = Math.hypot(player.x, player.z);
            if (distance > arena) {
                player.x = player.x / distance * arena;
                player.z = player.z / distance * arena;
            }
            tickAi(dt, config);
            Map<String, Object> confirm = confirmSkill(player, input, config);
            checkTimeout(config);
            return new GameRealtimeUpdate(snapshot(config, confirm), ended, wolfWin);
        }

        private void tickAi(double dt, Map<String, Object> config) {
            for (RuntimePlayer aiWolf : players.values()) {
                if (!aiWolf.ai || aiWolf.role != RoleType.WOLF || aiWolf.dead) continue;
                RuntimePlayer target = nearestLiveTarget(aiWolf);
                if (target == null) continue;
                double dx = target.x - aiWolf.x;
                double dz = target.z - aiWolf.z;
                double distance = Math.hypot(dx, dz);
                if (distance > 0.01) {
                    aiWolf.yaw = Math.atan2(dx, dz);
                    double speed = configDouble(config, "wolfBaseSpeed", 13) * 0.72;
                    aiWolf.x += dx / distance * speed * dt;
                    aiWolf.z += dz / distance * speed * dt;
                }
                if (distance <= 5.2) {
                    deadTargets.add(target.userId);
                    target.dead = true;
                    if (deadTargets.containsAll(targetDeer)) {
                        ended = true;
                        wolfWin = true;
                    }
                }
            }
        }

        private Map<String, Object> confirmSkill(RuntimePlayer player, Map<String, Object> input, Map<String, Object> config) {
            if (player.role == RoleType.WOLF && bool(input, "wolfScent")) {
                RuntimePlayer nearest = nearestLiveTarget(player);
                return Map.of("type", "WOLF_SCENT", "confirmed", true, "targetUserId", nearest == null ? "" : nearest.userId,
                        "distance", nearest == null ? -1 : Math.round(distance(player, nearest)));
            }
            if (player.role == RoleType.WOLF && bool(input, "wolfPounce")) {
                RuntimePlayer target = nearestLiveTarget(player);
                if (target != null && distance(player, target) <= 6.5) {
                    deadTargets.add(target.userId);
                    target.dead = true;
                    if (deadTargets.containsAll(targetDeer)) {
                        ended = true;
                        wolfWin = true;
                    }
                    return Map.of("type", "WOLF_POUNCE", "confirmed", true, "hit", true, "targetUserId", target.userId);
                }
                mistakes++;
                return Map.of("type", "WOLF_POUNCE", "confirmed", true, "hit", false, "mistakes", mistakes);
            }
            if (player.role == RoleType.DEER && bool(input, "deerLook")) {
                RuntimePlayer wolf = nearestWolf(player);
                return Map.of("type", "DEER_LOOK", "confirmed", true, "wolfDistance", wolf == null ? -1 : Math.round(distance(player, wolf)));
            }
            if (player.role == RoleType.DEER && bool(input, "deerEat")) {
                player.foodEaten++;
                return Map.of("type", "DEER_EAT", "confirmed", true, "foodEaten", player.foodEaten);
            }
            if (player.role == RoleType.DEER && bool(input, "deerCamouflage")) {
                player.camouflageUntilMs = System.currentTimeMillis() + Math.round(configDouble(config, "deerCamouflageDurationSeconds", 3) * 1000);
                return Map.of("type", "DEER_CAMOUFLAGE", "confirmed", true, "until", player.camouflageUntilMs);
            }
            return Map.of();
        }

        private void checkTimeout(Map<String, Object> config) {
            long durationMs = Math.round(configDouble(config, "durationSeconds", 240) * 1000);
            if (!ended && System.currentTimeMillis() - startedAtMs >= durationMs) {
                ended = true;
                wolfWin = false;
            }
        }

        private Map<String, Object> snapshot(Map<String, Object> config, Map<String, Object> skillConfirm) {
            Map<String, Object> result = new HashMap<>();
            long elapsedSeconds = Math.max(0, (System.currentTimeMillis() - startedAtMs) / 1000);
            long duration = Math.round(configDouble(config, "durationSeconds", 240));
            result.put("serverTimeLeft", Math.max(0, duration - elapsedSeconds));
            result.put("foundReal", deadTargets.size());
            result.put("realTotal", targetDeer.size());
            result.put("mistakes", mistakes);
            result.put("players", players.values().stream().map(RuntimePlayer::toMap).toList());
            result.put("skillConfirm", skillConfirm == null ? Map.of() : skillConfirm);
            result.put("matchEnded", ended);
            result.put("wolfWin", wolfWin);
            return result;
        }

        private RuntimePlayer nearestLiveTarget(RuntimePlayer origin) {
            RuntimePlayer best = null;
            double bestDistance = Double.MAX_VALUE;
            for (Long targetId : new HashSet<>(targetDeer)) {
                RuntimePlayer target = players.get(targetId);
                if (target == null || target.dead) continue;
                double nextDistance = distance(origin, target);
                if (nextDistance < bestDistance) {
                    best = target;
                    bestDistance = nextDistance;
                }
            }
            return best;
        }

        private RuntimePlayer nearestWolf(RuntimePlayer origin) {
            RuntimePlayer best = null;
            double bestDistance = Double.MAX_VALUE;
            for (RuntimePlayer player : players.values()) {
                if (player.role != RoleType.WOLF) continue;
                double nextDistance = distance(origin, player);
                if (nextDistance < bestDistance) {
                    best = player;
                    bestDistance = nextDistance;
                }
            }
            return best;
        }

        private static double distance(RuntimePlayer a, RuntimePlayer b) {
            return Math.hypot(a.x - b.x, a.z - b.z);
        }

        private static boolean bool(Map<String, Object> input, String key) {
            Object value = input.get(key);
            return Boolean.TRUE.equals(value) || "true".equalsIgnoreCase(String.valueOf(value));
        }
    }

    private static final class RuntimePlayer {
        final long userId;
        final String nickname;
        final RoleType role;
        final boolean ai;
        double x;
        double z;
        double yaw;
        boolean dead;
        int foodEaten;
        long camouflageUntilMs;

        RuntimePlayer(long userId, String nickname, RoleType role, boolean ai, double x, double z, double yaw) {
            this.userId = userId;
            this.nickname = nickname;
            this.role = role;
            this.ai = ai;
            this.x = x;
            this.z = z;
            this.yaw = yaw;
        }

        static RuntimePlayer spawn(MatchSnapshot.Player player, int index) {
            if (player.roleType() == RoleType.WOLF) {
                return new RuntimePlayer(player.userId(), player.nickname(), player.roleType(), player.ai(), 0, 22, Math.PI);
            }
            double angle = index * 1.93;
            double radius = 12 + index * 3.7;
            return new RuntimePlayer(player.userId(), player.nickname(), player.roleType(), player.ai(),
                    Math.cos(angle) * radius, Math.sin(angle) * radius, angle + Math.PI);
        }

        Map<String, Object> toMap() {
            return Map.of(
                    "userId", userId,
                    "nickname", nickname,
                    "roleType", role.name(),
                    "ai", ai,
                    "x", x,
                    "z", z,
                    "yaw", yaw,
                    "dead", dead,
                    "camouflageUntil", camouflageUntilMs
            );
        }
    }
}
