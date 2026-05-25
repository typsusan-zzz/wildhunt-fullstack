package com.wildhunt.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.common.util.Ids;
import com.wildhunt.dal.entity.PlayerProfileEntity;
import com.wildhunt.dal.entity.UserEntity;
import com.wildhunt.dal.mapper.PlayerProfileMapper;
import com.wildhunt.dal.mapper.UserMapper;
import com.wildhunt.service.dto.UserProfile;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private static final String DEFAULT_AVATAR = "/images/wildhunt-lobby-icons.png";
    private static final String DEFAULT_TITLE = "\u65b0\u664b\u730e\u624b";

    private final Map<Long, UserProfile> users = new ConcurrentHashMap<>();
    private final Map<String, Long> usernameIndex = new ConcurrentHashMap<>();
    private final Map<Long, String> passwordHashes = new ConcurrentHashMap<>();
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final UserMapper userMapper;
    private final PlayerProfileMapper profileMapper;

    public UserService() {
        this((UserMapper) null, (PlayerProfileMapper) null);
    }

    @Autowired
    public UserService(ObjectProvider<UserMapper> userMapper, ObjectProvider<PlayerProfileMapper> profileMapper) {
        this(userMapper.getIfAvailable(), profileMapper.getIfAvailable());
    }

    private UserService(UserMapper userMapper, PlayerProfileMapper profileMapper) {
        this.userMapper = userMapper;
        this.profileMapper = profileMapper;
    }

    public UserProfile createGuestUser() {
        long id = Ids.nextId();
        String username = "guest_" + id;
        UserProfile profile = new UserProfile(id, username,
                "\u6e38\u5ba2" + Long.toString(id).substring(Math.max(0, Long.toString(id).length() - 4)),
                DEFAULT_AVATAR, 1000, 1, 0, 0, 0, 0, DEFAULT_TITLE, false, 0);
        replace(profile);
        persistUser(profile, null, "GUEST");
        return profile;
    }

    public UserProfile register(String username, String password, String nickname) {
        String normalized = normalizeUsername(username);
        validatePassword(password);
        if (usernameIndex.containsKey(normalized) || loadUserByUsername(normalized) != null) {
            throw new BizException(ErrorCode.BAD_REQUEST, "\u7528\u6237\u540d\u5df2\u5b58\u5728");
        }
        long id = Ids.nextId();
        UserProfile profile = new UserProfile(id, normalized,
                ContentGuard.cleanDisplayText(nickname == null || nickname.isBlank() ? normalized : nickname, normalized, 64),
                DEFAULT_AVATAR, 1000, 1, 0, 0, 0, 0, DEFAULT_TITLE, false, 0);
        passwordHashes.put(id, passwordEncoder.encode(password));
        replace(profile);
        persistUser(profile, passwordHashes.get(id), "ACCOUNT");
        return profile;
    }

    public UserProfile login(String username, String password) {
        String normalized = normalizeUsername(username);
        UserProfile loaded = loadUserByUsername(normalized);
        Long userId = loaded == null ? usernameIndex.get(normalized) : loaded.userId();
        if (userId == null || !passwordEncoder.matches(password == null ? "" : password, passwordHashes.getOrDefault(userId, ""))) {
            throw new BizException(ErrorCode.UNAUTHORIZED, "\u8d26\u53f7\u6216\u5bc6\u7801\u9519\u8bef");
        }
        UserProfile user = users.get(userId);
        touchLogin(userId);
        return user;
    }

    public UserProfile get(Long userId) {
        UserProfile user = users.get(userId);
        if (user != null) return user;
        return loadUserById(userId);
    }

    public UserProfile updateProfile(Long userId, String nickname, String avatarUrl) {
        UserProfile old = getOrCreate(userId);
        UserProfile next = copy(old, ContentGuard.cleanDisplayText(nickname, old.nickname(), 64),
                avatarUrl == null ? old.avatarUrl() : avatarUrl, old.rating(), old.level(), old.exp(), old.trophies(),
                old.totalMatches(), old.totalWins(), old.title(), old.guideSeen(), old.unreadNotifications());
        replace(next);
        persistUser(next, passwordHashes.get(userId), next.username().startsWith("guest_") ? "GUEST" : "ACCOUNT");
        return next;
    }

    public UserProfile getOrCreate(Long userId) {
        UserProfile existing = get(userId);
        if (existing != null) return existing;
        UserProfile profile = new UserProfile(userId, "guest_" + userId, "\u6e38\u5ba2" + userId,
                DEFAULT_AVATAR, 1000, 1, 0, 0, 0, 0, DEFAULT_TITLE, false, 0);
        replace(profile);
        persistUser(profile, null, "GUEST");
        return profile;
    }

    public UserProfile bindGuestToAccount(Long userId, String username, String password, String nickname) {
        UserProfile old = getOrCreate(userId);
        String normalized = normalizeUsername(username);
        validatePassword(password);
        UserProfile existing = loadUserByUsername(normalized);
        Long existingId = existing == null ? usernameIndex.get(normalized) : existing.userId();
        if (existingId != null && !existingId.equals(userId)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "\u7528\u6237\u540d\u5df2\u5b58\u5728");
        }
        UserProfile next = new UserProfile(old.userId(), normalized,
                ContentGuard.cleanDisplayText(nickname == null || nickname.isBlank() ? old.nickname() : nickname, old.nickname(), 64),
                old.avatarUrl(), old.rating(), old.level(), old.exp(), old.trophies(), old.totalMatches(),
                old.totalWins(), old.title(), old.guideSeen(), old.unreadNotifications());
        passwordHashes.put(userId, passwordEncoder.encode(password));
        replace(next);
        persistUser(next, passwordHashes.get(userId), "ACCOUNT");
        return next;
    }

    public UserProfile addExp(Long userId, int expDelta) {
        UserProfile old = getOrCreate(userId);
        int nextExp = Math.max(0, old.exp() + Math.max(0, expDelta));
        int nextLevel = levelForExp(nextExp);
        return replaceAndPersist(copy(old, old.nickname(), old.avatarUrl(), old.rating(), nextLevel, nextExp, old.trophies(),
                old.totalMatches(), old.totalWins(), old.title(), old.guideSeen(), old.unreadNotifications()));
    }

    public UserProfile addTrophies(Long userId, int trophyDelta) {
        UserProfile old = getOrCreate(userId);
        int trophies = Math.max(0, old.trophies() + trophyDelta);
        int rating = Math.max(0, old.rating() + trophyDelta);
        return replaceAndPersist(copy(old, old.nickname(), old.avatarUrl(), rating, old.level(), old.exp(), trophies,
                old.totalMatches(), old.totalWins(), old.title(), old.guideSeen(), old.unreadNotifications()));
    }

    public UserProfile recordMatch(Long userId, boolean win, int expDelta, int trophyDelta) {
        UserProfile old = addExp(userId, expDelta);
        int trophies = Math.max(0, old.trophies() + trophyDelta);
        int rating = Math.max(0, old.rating() + trophyDelta);
        return replaceAndPersist(copy(old, old.nickname(), old.avatarUrl(), rating, old.level(), old.exp(), trophies,
                old.totalMatches() + 1, old.totalWins() + (win ? 1 : 0), old.title(), old.guideSeen(),
                old.unreadNotifications()));
    }

    public UserProfile markGuideSeen(Long userId) {
        UserProfile old = getOrCreate(userId);
        return replaceAndPersist(copy(old, old.nickname(), old.avatarUrl(), old.rating(), old.level(), old.exp(), old.trophies(),
                old.totalMatches(), old.totalWins(), old.title(), true, old.unreadNotifications()));
    }

    public UserProfile withUnreadCount(Long userId, int unread) {
        UserProfile old = getOrCreate(userId);
        return replace(copy(old, old.nickname(), old.avatarUrl(), old.rating(), old.level(), old.exp(), old.trophies(),
                old.totalMatches(), old.totalWins(), old.title(), old.guideSeen(), Math.max(0, unread)));
    }

    public int resetLeaderboardStats() {
        users.replaceAll((id, old) -> copy(old, old.nickname(), old.avatarUrl(), 1000, 1, 0, 0, 0, 0,
                old.title(), old.guideSeen(), old.unreadNotifications()));
        safeRun(() -> {
            if (profileMapper == null) return;
            profileMapper.update(null, new UpdateWrapper<PlayerProfileEntity>()
                    .set("rating", 1000)
                    .set("trophies", 0)
                    .set("total_matches", 0)
                    .set("total_wins", 0)
                    .set("exp", 0)
                    .set("level", 1)
                    .set("updated_at", LocalDateTime.now())
                    .eq("deleted", 0));
        });
        return users.size();
    }

    public Collection<UserProfile> allUsers() {
        Map<Long, UserProfile> merged = new LinkedHashMap<>(users);
        safeRun(() -> {
            if (userMapper == null) return;
            for (UserEntity entity : userMapper.selectList(new QueryWrapper<UserEntity>().eq("deleted", 0).last("LIMIT 50"))) {
                merged.putIfAbsent(entity.getId(), toProfile(entity, loadProfile(entity.getId()), 0));
            }
        });
        return merged.values();
    }

    private UserProfile replaceAndPersist(UserProfile profile) {
        replace(profile);
        persistProfile(profile);
        return profile;
    }

    private UserProfile replace(UserProfile profile) {
        users.put(profile.userId(), profile);
        usernameIndex.put(profile.username(), profile.userId());
        return profile;
    }

    private void persistUser(UserProfile profile, String passwordHash, String userType) {
        safeRun(() -> {
            if (userMapper == null) return;
            LocalDateTime now = LocalDateTime.now();
            UserEntity entity = userMapper.selectById(profile.userId());
            if (entity == null) {
                entity = new UserEntity();
                entity.setId(profile.userId());
                entity.setCreatedAt(now);
            }
            entity.setUsername(profile.username());
            entity.setNickname(profile.nickname());
            entity.setAvatarUrl(profile.avatarUrl());
            if (passwordHash != null) entity.setPasswordHash(passwordHash);
            entity.setUserType(userType);
            entity.setStatus("ACTIVE");
            entity.setUpdatedAt(now);
            entity.setDeleted(0);
            if (entity.getCreatedAt() == null) entity.setCreatedAt(now);
            if (userMapper.selectById(profile.userId()) == null) userMapper.insert(entity);
            else userMapper.updateById(entity);
            persistProfile(profile);
        });
    }

    private void persistProfile(UserProfile profile) {
        safeRun(() -> {
            if (profileMapper == null) return;
            LocalDateTime now = LocalDateTime.now();
            PlayerProfileEntity entity = loadProfile(profile.userId());
            if (entity == null) {
                entity = new PlayerProfileEntity();
                entity.setId(Ids.nextId());
                entity.setUserId(profile.userId());
                entity.setCreatedAt(now);
            }
            entity.setLevel(profile.level());
            entity.setExp(profile.exp());
            entity.setRating(profile.rating());
            entity.setTrophies(profile.trophies());
            entity.setTotalMatches(profile.totalMatches());
            entity.setTotalWins(profile.totalWins());
            entity.setTitle(profile.title());
            entity.setGuideCompleted(profile.guideSeen() ? 1 : 0);
            entity.setUpdatedAt(now);
            entity.setDeleted(0);
            if (profileMapper.selectById(entity.getId()) == null) profileMapper.insert(entity);
            else profileMapper.updateById(entity);
        });
    }

    private void touchLogin(Long userId) {
        safeRun(() -> {
            if (userMapper == null) return;
            UserEntity entity = userMapper.selectById(userId);
            if (entity == null) return;
            entity.setLastLoginAt(LocalDateTime.now());
            entity.setUpdatedAt(entity.getLastLoginAt());
            userMapper.updateById(entity);
        });
    }

    private UserProfile loadUserByUsername(String username) {
        if (username == null) return null;
        final UserProfile[] loaded = {null};
        safeRun(() -> {
            if (userMapper == null) return;
            UserEntity entity = userMapper.selectOne(new QueryWrapper<UserEntity>()
                    .eq("username", username)
                    .eq("deleted", 0)
                    .last("LIMIT 1"));
            loaded[0] = entity == null ? null : remember(entity);
        });
        return loaded[0];
    }

    private UserProfile loadUserById(Long userId) {
        if (userId == null) return null;
        final UserProfile[] loaded = {null};
        safeRun(() -> {
            if (userMapper == null) return;
            UserEntity entity = userMapper.selectById(userId);
            loaded[0] = entity == null || Integer.valueOf(1).equals(entity.getDeleted()) ? null : remember(entity);
        });
        return loaded[0];
    }

    private UserProfile remember(UserEntity entity) {
        PlayerProfileEntity profileEntity = loadProfile(entity.getId());
        UserProfile profile = toProfile(entity, profileEntity, users.getOrDefault(entity.getId(), empty(entity.getId())).unreadNotifications());
        if (entity.getPasswordHash() != null) passwordHashes.put(entity.getId(), entity.getPasswordHash());
        replace(profile);
        return profile;
    }

    private PlayerProfileEntity loadProfile(Long userId) {
        final PlayerProfileEntity[] loaded = {null};
        safeRun(() -> {
            if (profileMapper == null) return;
            loaded[0] = profileMapper.selectOne(new QueryWrapper<PlayerProfileEntity>()
                    .eq("user_id", userId)
                    .eq("deleted", 0)
                    .last("LIMIT 1"));
        });
        return loaded[0];
    }

    private static UserProfile toProfile(UserEntity user, PlayerProfileEntity profile, int unread) {
        return new UserProfile(user.getId(), user.getUsername(), user.getNickname(), user.getAvatarUrl(),
                profile == null || profile.getRating() == null ? 1000 : profile.getRating(),
                profile == null || profile.getLevel() == null ? 1 : profile.getLevel(),
                profile == null || profile.getExp() == null ? 0 : profile.getExp(),
                profile == null || profile.getTrophies() == null ? 0 : profile.getTrophies(),
                profile == null || profile.getTotalMatches() == null ? 0 : profile.getTotalMatches(),
                profile == null || profile.getTotalWins() == null ? 0 : profile.getTotalWins(),
                profile == null || profile.getTitle() == null ? DEFAULT_TITLE : profile.getTitle(),
                profile != null && Integer.valueOf(1).equals(profile.getGuideCompleted()), unread);
    }

    private static UserProfile empty(Long userId) {
        return new UserProfile(userId, "guest_" + userId, "\u6e38\u5ba2" + userId, DEFAULT_AVATAR,
                1000, 1, 0, 0, 0, 0, DEFAULT_TITLE, false, 0);
    }

    private static int levelForExp(int exp) {
        int level = 1;
        int remaining = exp;
        while (level < 100) {
            int required = 100 + level * 50;
            if (remaining < required) break;
            remaining -= required;
            level++;
        }
        return level;
    }

    private static UserProfile copy(UserProfile old, String nickname, String avatarUrl, int rating, int level, int exp,
                                    int trophies, int totalMatches, int totalWins, String title, boolean guideSeen,
                                    int unreadNotifications) {
        return new UserProfile(old.userId(), old.username(), nickname, avatarUrl, rating, level, exp, trophies,
                totalMatches, totalWins, title, guideSeen, unreadNotifications);
    }

    private static String normalizeUsername(String username) {
        if (username == null || username.isBlank() || username.length() > 64) {
            throw new BizException(ErrorCode.BAD_REQUEST, "\u7528\u6237\u540d\u957f\u5ea6\u4e0d\u6b63\u786e");
        }
        return username.trim().toLowerCase();
    }

    private static void validatePassword(String password) {
        if (password == null || password.length() < 6 || password.length() > 72) {
            throw new BizException(ErrorCode.BAD_REQUEST, "\u5bc6\u7801\u957f\u5ea6\u9700\u4e3a 6-72 \u4f4d");
        }
    }

    private static void safeRun(Runnable runnable) {
        try {
            runnable.run();
        } catch (RuntimeException ignored) {
            // Keep the in-memory development path available when MySQL is not running.
        }
    }
}
