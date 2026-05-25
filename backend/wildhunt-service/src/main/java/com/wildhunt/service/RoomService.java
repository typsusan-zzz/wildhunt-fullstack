package com.wildhunt.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.wildhunt.common.constant.GameConstants;
import com.wildhunt.common.enums.QueueType;
import com.wildhunt.common.enums.RoleType;
import com.wildhunt.common.enums.RoomStatus;
import com.wildhunt.common.exception.BizException;
import com.wildhunt.common.exception.ErrorCode;
import com.wildhunt.common.util.Ids;
import com.wildhunt.dal.entity.RoomEntity;
import com.wildhunt.dal.entity.RoomKickLogEntity;
import com.wildhunt.dal.entity.RoomMemberEntity;
import com.wildhunt.dal.mapper.RoomKickLogMapper;
import com.wildhunt.dal.mapper.RoomMapper;
import com.wildhunt.dal.mapper.RoomMemberMapper;
import com.wildhunt.service.GameMatchService.PlayerAssignment;
import com.wildhunt.service.dto.RoomMemberDto;
import com.wildhunt.service.dto.RoomSnapshot;
import com.wildhunt.service.dto.StartGameResult;
import com.wildhunt.service.dto.UserProfile;
import com.wildhunt.service.event.RoomRealtimeEvent;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoomService {
    private static final String PLAYER_ROOM = "PLAYER";
    private static final String SYSTEM_ROOM = "SYSTEM";

    private final UserService userService;
    private final GameMatchService gameMatchService;
    private final PlayerPresenceService presenceService;
    private final ApplicationEventPublisher events;
    private final RoomMapper roomMapper;
    private final RoomMemberMapper roomMemberMapper;
    private final RoomKickLogMapper roomKickLogMapper;
    private final Map<Long, MutableRoom> rooms = new ConcurrentHashMap<>();

    public RoomService(UserService userService) {
        this(userService, new GameMatchService(userService), new PlayerPresenceService(), event -> {
        }, (RoomMapper) null, (RoomMemberMapper) null, (RoomKickLogMapper) null);
    }

    public RoomService(UserService userService, GameMatchService gameMatchService, ApplicationEventPublisher events) {
        this(userService, gameMatchService, new PlayerPresenceService(), events,
                (RoomMapper) null, (RoomMemberMapper) null, (RoomKickLogMapper) null);
    }

    @Autowired
    public RoomService(
            UserService userService,
            GameMatchService gameMatchService,
            PlayerPresenceService presenceService,
            ApplicationEventPublisher events,
            ObjectProvider<RoomMapper> roomMapper,
            ObjectProvider<RoomMemberMapper> roomMemberMapper,
            ObjectProvider<RoomKickLogMapper> roomKickLogMapper) {
        this(userService, gameMatchService, presenceService, events, roomMapper.getIfAvailable(),
                roomMemberMapper.getIfAvailable(), roomKickLogMapper.getIfAvailable());
    }

    private RoomService(UserService userService, GameMatchService gameMatchService, PlayerPresenceService presenceService,
                        ApplicationEventPublisher events,
                        RoomMapper roomMapper, RoomMemberMapper roomMemberMapper, RoomKickLogMapper roomKickLogMapper) {
        this.userService = userService;
        this.gameMatchService = gameMatchService;
        this.presenceService = presenceService;
        this.events = events;
        this.roomMapper = roomMapper;
        this.roomMemberMapper = roomMemberMapper;
        this.roomKickLogMapper = roomKickLogMapper;
    }

    @Transactional
    public RoomSnapshot createRoom(Long userId, String name, int maxPlayers, int aiDeerCount, boolean publicRoom) {
        RoomSnapshot current = currentRoom(userId);
        if (current != null) {
            throw new BizException(ErrorCode.ALREADY_IN_ROOM, "你已在房间内，请先退出当前房间");
        }

        long id = Ids.nextId();
        MutableRoom room = new MutableRoom(id, Ids.roomCode(GameConstants.ROOM_CODE_LENGTH), normalizeRoomName(name),
                userId, Math.min(GameConstants.MAX_ROOM_PLAYERS, Math.max(1, maxPlayers)), aiDeerCount,
                publicRoom, PLAYER_ROOM);
        room.members.add(new MutableMember(userId, true, true, RoleType.WOLF, 1));
        rooms.put(id, room);
        persistRoom(room);
        persistMember(room.id, room.members.get(0));
        presenceService.setInRoom(userId, room.id);
        RoomSnapshot snapshot = snapshot(room);
        publishSystem(room, "玩家 " + userService.getOrCreate(userId).nickname() + " 创建了房间");
        publishSnapshot(room);
        return snapshot;
    }

    @Transactional
    public RoomSnapshot createSystemRoom(Long userId, QueueType queueType) {
        RoleType role = queueType == QueueType.DEER ? RoleType.DEER : RoleType.WOLF;
        return createSystemRoom(List.of(new PlayerAssignment(userId, role)), GameConstants.DEFAULT_AI_DEER_COUNT);
    }

    @Transactional
    public RoomSnapshot createSystemRoom(List<PlayerAssignment> assignments, int aiDeerCount) {
        if (assignments.isEmpty()) throw new BizException(ErrorCode.BAD_REQUEST, "匹配玩家不能为空");
        long id = Ids.nextId();
        Long ownerUserId = assignments.get(0).userId();
        MutableRoom room = new MutableRoom(id, Ids.roomCode(GameConstants.ROOM_CODE_LENGTH),
                "系统匹配对局", ownerUserId, GameConstants.MAX_ROOM_PLAYERS, aiDeerCount, false, SYSTEM_ROOM);
        room.status = RoomStatus.PLAYING;
        int seat = 1;
        for (PlayerAssignment assignment : assignments) {
            room.members.add(new MutableMember(assignment.userId(), assignment.userId().equals(ownerUserId), true,
                    assignment.roleType(), seat++));
        }
        room.currentMatchId = gameMatchService.createMatch(id, assignments, aiDeerCount).matchId();
        rooms.put(id, room);
        persistRoom(room);
        room.members.forEach(member -> persistMember(room.id, member));
        assignments.forEach(assignment -> presenceService.setPlaying(assignment.userId(), room.currentMatchId));
        RoomSnapshot snapshot = snapshot(room);
        for (PlayerAssignment assignment : assignments) {
            events.publishEvent(RoomRealtimeEvent.targeted("GAME_START", id,
                    new StartGameResult(room.currentMatchId, assignment.roleType()), assignment.userId()));
        }
        publishSnapshot(room);
        return snapshot;
    }

    public List<RoomSnapshot> listPublicRooms() {
        List<RoomSnapshot> persisted = persistedPublicRooms();
        if (!persisted.isEmpty()) return persisted;
        return rooms.values().stream()
                .filter(room -> room.publicRoom && PLAYER_ROOM.equals(room.roomType) && room.status == RoomStatus.WAITING)
                .sorted(Comparator.comparing(room -> room.id))
                .map(this::snapshot)
                .toList();
    }

    public RoomSnapshot currentRoom(Long userId) {
        if (userId == null) return null;
        RoomSnapshot persisted = persistedCurrentRoom(userId);
        if (persisted != null) return persisted;
        Optional<MutableRoom> room = rooms.values().stream()
                .filter(item -> PLAYER_ROOM.equals(item.roomType) && item.status != RoomStatus.CLOSED)
                .filter(item -> item.members.stream().anyMatch(member -> member.userId.equals(userId) && member.active()))
                .sorted(Comparator.comparing((MutableRoom item) -> item.createdAt).reversed())
                .findFirst();
        return room.map(this::snapshot).orElse(null);
    }

    public RoomSnapshot getRoom(Long roomId) {
        return snapshot(find(roomId));
    }

    @Transactional
    public RoomSnapshot join(Long userId, Long roomId) {
        MutableRoom room = find(roomId);
        synchronized (room) {
            ensurePlayerJoinable(room);
            RoomSnapshot current = currentRoom(userId);
            if (current != null && !current.id().equals(roomId)) {
                throw new BizException(ErrorCode.ALREADY_IN_ROOM, "你已在房间内，请先退出当前房间");
            }
            Optional<MutableMember> old = room.members.stream()
                    .filter(member -> member.userId.equals(userId) && member.active())
                    .findFirst();
            if (old.isPresent()) return snapshot(room);
            if (activeMembers(room).size() >= room.maxPlayers) {
                throw new BizException(ErrorCode.ROOM_FULL, "房间已满");
            }
            int seatNo = room.members.stream().map(member -> member.seatNo).max(Integer::compareTo).orElse(0) + 1;
            MutableMember joined = new MutableMember(userId, false, false, RoleType.DEER, seatNo);
            room.members.add(joined);
            room.updatedAt = LocalDateTime.now();
            persistRoom(room);
            persistMember(room.id, joined);
            presenceService.setInRoom(userId, room.id);
            publishSystem(room, "玩家 " + userService.getOrCreate(userId).nickname() + " 加入房间");
            publishSnapshot(room);
            return snapshot(room);
        }
    }

    public RoomSnapshot joinByCode(Long userId, String code) {
        MutableRoom room = rooms.values().stream()
                .filter(item -> PLAYER_ROOM.equals(item.roomType))
                .filter(item -> item.roomCode.equalsIgnoreCase(code) || item.roomCode.equalsIgnoreCase(code.replace("#", "")))
                .findFirst()
                .orElseThrow(() -> new BizException(ErrorCode.ROOM_NOT_FOUND, "房间不存在或已关闭"));
        return join(userId, room.id);
    }

    @Transactional
    public RoomSnapshot ready(Long userId, Long roomId, boolean ready) {
        MutableRoom room = find(roomId);
        synchronized (room) {
            MutableMember member = activeMember(room, userId);
            member.ready = ready;
            room.updatedAt = LocalDateTime.now();
            persistRoom(room);
            persistMember(room.id, member);
            publishSnapshot(room);
            return snapshot(room);
        }
    }

    @Transactional
    public StartGameResult start(Long userId, Long roomId) {
        MutableRoom room = find(roomId);
        synchronized (room) {
            if (!room.ownerUserId.equals(userId)) throw new BizException(ErrorCode.NOT_ROOM_OWNER, "只有房主可以开始游戏");
            if (room.status == RoomStatus.PLAYING) {
                RoleType assigned = activeMember(room, userId).role;
                return new StartGameResult(room.currentMatchId == null ? Ids.nextId() : room.currentMatchId, assigned);
            }
            List<MutableMember> members = activeMembers(room);
            if (members.isEmpty()) throw new BizException(ErrorCode.NOT_ROOM_MEMBER, "房间内没有玩家");
            if (members.stream().filter(member -> !member.owner).anyMatch(member -> !member.ready)) {
                throw new BizException(ErrorCode.ROOM_NOT_READY, "还有玩家未准备");
            }
            room.status = RoomStatus.PLAYING;
            MutableMember wolf = members.get(new Random(room.id).nextInt(members.size()));
            int aiDeerCount = Math.max(GameConstants.DEFAULT_AI_DEER_COUNT, room.aiDeerCount);
            List<PlayerAssignment> assignments = new ArrayList<>();
            for (MutableMember member : members) {
                member.role = member.userId.equals(wolf.userId) ? RoleType.WOLF : RoleType.DEER;
                assignments.add(new PlayerAssignment(member.userId, member.role));
            }
            room.currentMatchId = gameMatchService.createMatch(room.id, assignments, aiDeerCount).matchId();
            room.updatedAt = LocalDateTime.now();
            persistRoom(room);
            members.forEach(member -> persistMember(room.id, member));
            members.forEach(member -> presenceService.setPlaying(member.userId, room.currentMatchId));
            for (MutableMember member : members) {
                events.publishEvent(RoomRealtimeEvent.targeted("GAME_START", room.id,
                        new StartGameResult(room.currentMatchId, member.role), member.userId));
            }
            RoleType role = activeMember(room, userId).role;
            publishSystem(room, "对局已开始，角色已随机分配");
            publishSnapshot(room);
            return new StartGameResult(room.currentMatchId, role);
        }
    }

    @Transactional
    public RoomSnapshot leave(Long userId, Long roomId) {
        MutableRoom room = find(roomId);
        synchronized (room) {
            Optional<MutableMember> optional = room.members.stream()
                    .filter(member -> member.userId.equals(userId) && member.active())
                    .findFirst();
            if (optional.isEmpty()) return snapshot(room);
            MutableMember leaving = optional.get();
            boolean wasOwner = leaving.owner;
            leaving.leave("LEAVE");
            presenceService.clearRoom(userId);
            afterMemberLeft(room, wasOwner);
            persistRoom(room);
            persistMember(room.id, leaving);
            activeMembers(room).forEach(member -> persistMember(room.id, member));
            publishSystem(room, "玩家 " + userService.getOrCreate(userId).nickname() + " 离开房间");
            publishSnapshot(room);
            return snapshot(room);
        }
    }

    @Transactional
    public RoomSnapshot kick(Long operatorUserId, Long roomId, Long targetUserId, String reason) {
        MutableRoom room = find(roomId);
        synchronized (room) {
            MutableMember operator = activeMember(room, operatorUserId);
            if (!operator.owner) throw new BizException(ErrorCode.NOT_ROOM_OWNER, "只有房主可以操作");
            if (operatorUserId.equals(targetUserId)) throw new BizException(ErrorCode.BAD_REQUEST, "不能踢出自己");
            Optional<MutableMember> target = room.members.stream()
                    .filter(member -> member.userId.equals(targetUserId) && member.active())
                    .findFirst();
            if (target.isEmpty()) return snapshot(room);
            boolean wasOwner = target.get().owner;
            target.get().leave("KICK");
            presenceService.clearRoom(targetUserId);
            room.kickLogs.add(new KickLog(operatorUserId, targetUserId, reason));
            afterMemberLeft(room, wasOwner);
            persistRoom(room);
            persistMember(room.id, target.get());
            activeMembers(room).forEach(member -> persistMember(room.id, member));
            persistKick(room.id, operatorUserId, targetUserId, reason);
            events.publishEvent(RoomRealtimeEvent.targeted("ROOM_KICKED", room.id,
                    Map.of("roomId", room.id, "reason", reason == null ? "" : reason), targetUserId));
            publishSystem(room, "玩家 " + userService.getOrCreate(targetUserId).nickname() + " 被房主移出房间");
            publishSnapshot(room);
            return snapshot(room);
        }
    }

    public boolean isActiveMember(Long userId, Long roomId) {
        if (userId == null || roomId == null) return false;
        MutableRoom room = rooms.get(roomId);
        if (room == null) {
            room = loadRoom(roomId);
            if (room != null) rooms.put(roomId, room);
        }
        return room != null && room.members.stream().anyMatch(member -> member.userId.equals(userId) && member.active());
    }

    private void afterMemberLeft(MutableRoom room, boolean ownerLeft) {
        List<MutableMember> remaining = activeMembers(room);
        if (remaining.isEmpty()) {
            room.status = RoomStatus.CLOSED;
            room.closedAt = LocalDateTime.now();
            room.updatedAt = room.closedAt;
            events.publishEvent(RoomRealtimeEvent.broadcast("ROOM_CLOSED", room.id, snapshot(room)));
            return;
        }
        if (ownerLeft) {
            MutableMember nextOwner = remaining.stream()
                    .min(Comparator.comparingInt((MutableMember member) -> member.seatNo).thenComparing(member -> member.joinedAt))
                    .orElseThrow();
            nextOwner.owner = true;
            nextOwner.ready = true;
            room.ownerUserId = nextOwner.userId;
            events.publishEvent(RoomRealtimeEvent.broadcast("ROOM_OWNER_TRANSFERRED", room.id,
                    Map.of("ownerUserId", nextOwner.userId)));
        }
        room.updatedAt = LocalDateTime.now();
    }

    private MutableRoom find(Long roomId) {
        MutableRoom room = rooms.get(roomId);
        if (room == null) {
            room = loadRoom(roomId);
            if (room != null) rooms.put(roomId, room);
        }
        if (room == null || room.status == RoomStatus.CLOSED) {
            throw new BizException(ErrorCode.ROOM_NOT_FOUND, "房间不存在或已关闭");
        }
        return room;
    }

    private void ensurePlayerJoinable(MutableRoom room) {
        if (!PLAYER_ROOM.equals(room.roomType)) throw new BizException(ErrorCode.ROOM_NOT_FOUND, "房间不存在或已关闭");
        if (room.status == RoomStatus.PLAYING) throw new BizException(ErrorCode.ROOM_ALREADY_STARTED, "房间已开始游戏");
        if (room.status != RoomStatus.WAITING) throw new BizException(ErrorCode.ROOM_NOT_FOUND, "房间不存在或已关闭");
    }

    private MutableMember activeMember(MutableRoom room, Long userId) {
        return room.members.stream()
                .filter(member -> member.userId.equals(userId) && member.active())
                .findFirst()
                .orElseThrow(() -> new BizException(ErrorCode.NOT_ROOM_MEMBER, "请先加入房间"));
    }

    private static List<MutableMember> activeMembers(MutableRoom room) {
        return room.members.stream()
                .filter(MutableMember::active)
                .sorted(Comparator.comparingInt((MutableMember member) -> member.seatNo).thenComparing(member -> member.joinedAt))
                .toList();
    }

    private RoomSnapshot snapshot(MutableRoom room) {
        List<RoomMemberDto> members = activeMembers(room).stream().map(member -> {
            UserProfile user = userService.getOrCreate(member.userId);
            return new RoomMemberDto(member.userId, user.nickname(), member.role, member.ready, member.owner);
        }).toList();
        return new RoomSnapshot(room.id, room.roomCode, room.name, room.status, room.ownerUserId, room.maxPlayers,
                room.aiDeerCount, room.currentMatchId, members.size(), members, "http://localhost:5173?invite=" + room.roomCode,
                new RoomSnapshot.NetworkQuality("UNKNOWN", 0, 0, LocalDateTime.now().toString()));
    }

    private void publishSnapshot(MutableRoom room) {
        events.publishEvent(RoomRealtimeEvent.broadcast("ROOM_SNAPSHOT", room.id, snapshot(room)));
    }

    private void publishSystem(MutableRoom room, String content) {
        events.publishEvent(RoomRealtimeEvent.broadcast("ROOM_MEMBER_EVENT", room.id, Map.of("content", content)));
    }

    private static String normalizeRoomName(String name) {
        return ContentGuard.cleanDisplayText(name, "WildHunt 房间", 32);
    }

    public Map<String, Object> clearRoomData() {
        rooms.clear();
        presenceService.clearAll();
        gameMatchService.clearRuntime();
        LocalDateTime now = LocalDateTime.now();
        int roomRows = 0;
        int memberRows = 0;
        int kickRows = 0;
        try {
            if (roomMapper != null) {
                roomRows = roomMapper.update(null, new UpdateWrapper<RoomEntity>()
                        .set("status", RoomStatus.CLOSED.name())
                        .set("closed_at", now)
                        .set("updated_at", now)
                        .set("deleted", 1)
                        .eq("deleted", 0));
            }
        } catch (RuntimeException ignored) {
            roomRows = 0;
        }
        try {
            if (roomMemberMapper != null) {
                memberRows = roomMemberMapper.update(null, new UpdateWrapper<RoomMemberEntity>()
                        .set("left_at", now)
                        .set("leave_reason", "ADMIN_CLEAR")
                        .set("updated_at", now)
                        .set("deleted", 1)
                        .eq("deleted", 0));
            }
        } catch (RuntimeException ignored) {
            memberRows = 0;
        }
        try {
            if (roomKickLogMapper != null) {
                kickRows = roomKickLogMapper.update(null, new UpdateWrapper<RoomKickLogEntity>()
                        .set("updated_at", now)
                        .set("deleted", 1)
                        .eq("deleted", 0));
            }
        } catch (RuntimeException ignored) {
            kickRows = 0;
        }
        return Map.of("rooms", roomRows, "members", memberRows, "kickLogs", kickRows);
    }

    private List<RoomSnapshot> persistedPublicRooms() {
        try {
            if (roomMapper == null) return List.of();
            return roomMapper.selectList(new QueryWrapper<RoomEntity>()
                            .eq("room_type", PLAYER_ROOM)
                            .eq("status", RoomStatus.WAITING.name())
                            .eq("public_room", 1)
                            .eq("deleted", 0)
                            .orderByAsc("created_at"))
                    .stream()
                    .map(this::loadRoom)
                    .filter(room -> room != null && room.status == RoomStatus.WAITING)
                    .map(this::snapshot)
                    .toList();
        } catch (RuntimeException ignored) {
            return List.of();
        }
    }

    private RoomSnapshot persistedCurrentRoom(Long userId) {
        try {
            if (roomMemberMapper == null || roomMapper == null) return null;
            List<RoomMemberEntity> memberships = roomMemberMapper.selectList(new QueryWrapper<RoomMemberEntity>()
                    .eq("user_id", userId)
                    .isNull("left_at")
                    .eq("deleted", 0)
                    .orderByDesc("created_at"));
            for (RoomMemberEntity member : memberships) {
                MutableRoom room = loadRoom(member.getRoomId());
                if (room != null && PLAYER_ROOM.equals(room.roomType) && room.status != RoomStatus.CLOSED) {
                    rooms.put(room.id, room);
                    return snapshot(room);
                }
            }
        } catch (RuntimeException ignored) {
            return null;
        }
        return null;
    }

    private MutableRoom loadRoom(Long roomId) {
        try {
            if (roomMapper == null || roomMemberMapper == null || roomId == null) return null;
            RoomEntity entity = roomMapper.selectById(roomId);
            return loadRoom(entity);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private MutableRoom loadRoom(RoomEntity entity) {
        if (entity == null || Integer.valueOf(1).equals(entity.getDeleted())) return null;
        MutableRoom room = new MutableRoom(entity.getId(), entity.getRoomCode(), entity.getName(), entity.getOwnerUserId(),
                entity.getMaxPlayers() == null ? GameConstants.MAX_ROOM_PLAYERS : entity.getMaxPlayers(),
                entity.getAiDeerCount() == null ? GameConstants.DEFAULT_AI_DEER_COUNT : entity.getAiDeerCount(),
                Integer.valueOf(1).equals(entity.getPublicRoom()), entity.getRoomType() == null ? PLAYER_ROOM : entity.getRoomType());
        room.status = parseStatus(entity.getStatus());
        room.currentMatchId = entity.getCurrentMatchId();
        room.closedAt = entity.getClosedAt();
        room.updatedAt = entity.getUpdatedAt() == null ? room.createdAt : entity.getUpdatedAt();
        try {
            if (roomMemberMapper != null) {
                for (RoomMemberEntity member : roomMemberMapper.selectList(new QueryWrapper<RoomMemberEntity>()
                        .eq("room_id", entity.getId())
                        .orderByAsc("seat_no", "created_at"))) {
                    MutableMember mutable = new MutableMember(member.getUserId(), Integer.valueOf(1).equals(member.getOwnerFlag()),
                            Integer.valueOf(1).equals(member.getReady()), parseRole(member.getRoleType()),
                            member.getSeatNo() == null ? room.members.size() + 1 : member.getSeatNo());
                    mutable.leftAt = member.getLeftAt();
                    mutable.leaveReason = member.getLeaveReason();
                    room.members.add(mutable);
                }
            }
        } catch (RuntimeException ignored) {
            return room;
        }
        return room;
    }

    private void persistRoom(MutableRoom room) {
        try {
            if (roomMapper == null) return;
            LocalDateTime now = LocalDateTime.now();
            RoomEntity entity = roomMapper.selectById(room.id);
            boolean insert = entity == null;
            if (entity == null) {
                entity = new RoomEntity();
                entity.setId(room.id);
                entity.setCreatedAt(room.createdAt);
            }
            entity.setRoomCode(room.roomCode);
            entity.setName(room.name);
            entity.setOwnerUserId(room.ownerUserId);
            entity.setStatus(room.status.name());
            entity.setRoomType(room.roomType);
            entity.setMaxPlayers(room.maxPlayers);
            entity.setAiDeerCount(room.aiDeerCount);
            entity.setPublicRoom(room.publicRoom ? 1 : 0);
            entity.setCurrentMatchId(room.currentMatchId);
            entity.setClosedAt(room.closedAt);
            entity.setVersion(entity.getVersion() == null ? 0 : entity.getVersion() + 1);
            entity.setUpdatedAt(now);
            entity.setDeleted(0);
            if (entity.getCreatedAt() == null) entity.setCreatedAt(room.createdAt);
            if (insert) roomMapper.insert(entity);
            else roomMapper.updateById(entity);
        } catch (RuntimeException ignored) {
            // Database persistence is best-effort in local development.
        }
    }

    private void persistMember(Long roomId, MutableMember member) {
        try {
            if (roomMemberMapper == null) return;
            LocalDateTime now = LocalDateTime.now();
            RoomMemberEntity entity = roomMemberMapper.selectOne(new QueryWrapper<RoomMemberEntity>()
                    .eq("room_id", roomId)
                    .eq("user_id", member.userId)
                    .last("LIMIT 1"));
            boolean insert = entity == null;
            if (entity == null) {
                entity = new RoomMemberEntity();
                entity.setId(Ids.nextId());
                entity.setRoomId(roomId);
                entity.setUserId(member.userId);
                entity.setCreatedAt(member.joinedAt);
            }
            entity.setSeatNo(member.seatNo);
            entity.setRoleType(member.role.name());
            entity.setReady(member.ready ? 1 : 0);
            entity.setOwnerFlag(member.owner ? 1 : 0);
            entity.setConnected(member.active() ? 1 : 0);
            entity.setJoinedAt(member.joinedAt);
            entity.setLeftAt(member.leftAt);
            entity.setLeaveReason(member.leaveReason);
            entity.setUpdatedAt(now);
            entity.setDeleted(member.active() ? 0 : 1);
            if (insert) roomMemberMapper.insert(entity);
            else roomMemberMapper.updateById(entity);
        } catch (RuntimeException ignored) {
            // Database persistence is best-effort in local development.
        }
    }

    private void persistKick(Long roomId, Long operatorUserId, Long targetUserId, String reason) {
        try {
            if (roomKickLogMapper == null) return;
            LocalDateTime now = LocalDateTime.now();
            RoomKickLogEntity entity = new RoomKickLogEntity();
            entity.setId(Ids.nextId());
            entity.setRoomId(roomId);
            entity.setOperatorUserId(operatorUserId);
            entity.setTargetUserId(targetUserId);
            entity.setReason(reason);
            entity.setCreatedAt(now);
            entity.setUpdatedAt(now);
            entity.setDeleted(0);
            roomKickLogMapper.insert(entity);
        } catch (RuntimeException ignored) {
            // Database persistence is best-effort in local development.
        }
    }

    private static RoomStatus parseStatus(String status) {
        try {
            return status == null ? RoomStatus.WAITING : RoomStatus.valueOf(status);
        } catch (IllegalArgumentException ignored) {
            return RoomStatus.WAITING;
        }
    }

    private static RoleType parseRole(String role) {
        try {
            return role == null ? RoleType.DEER : RoleType.valueOf(role);
        } catch (IllegalArgumentException ignored) {
            return RoleType.DEER;
        }
    }

    private static final class MutableRoom {
        final Long id;
        final String roomCode;
        final String name;
        Long ownerUserId;
        final int maxPlayers;
        final int aiDeerCount;
        final boolean publicRoom;
        final String roomType;
        final LocalDateTime createdAt = LocalDateTime.now();
        final List<MutableMember> members = new ArrayList<>();
        final List<KickLog> kickLogs = new ArrayList<>();
        RoomStatus status = RoomStatus.WAITING;
        Long currentMatchId;
        LocalDateTime updatedAt = createdAt;
        LocalDateTime closedAt;

        MutableRoom(Long id, String roomCode, String name, Long ownerUserId, int maxPlayers, int aiDeerCount,
                    boolean publicRoom, String roomType) {
            this.id = id;
            this.roomCode = roomCode;
            this.name = name;
            this.ownerUserId = ownerUserId;
            this.maxPlayers = maxPlayers;
            this.aiDeerCount = aiDeerCount;
            this.publicRoom = publicRoom;
            this.roomType = roomType;
        }
    }

    private static final class MutableMember {
        final Long userId;
        final int seatNo;
        final LocalDateTime joinedAt = LocalDateTime.now();
        boolean owner;
        boolean ready;
        RoleType role;
        LocalDateTime leftAt;
        String leaveReason;

        MutableMember(Long userId, boolean owner, boolean ready, RoleType role, int seatNo) {
            this.userId = userId;
            this.owner = owner;
            this.ready = ready;
            this.role = role;
            this.seatNo = seatNo;
        }

        boolean active() {
            return leftAt == null;
        }

        void leave(String reason) {
            owner = false;
            ready = false;
            leaveReason = reason;
            leftAt = LocalDateTime.now();
        }
    }

    private record KickLog(Long operatorUserId, Long targetUserId, String reason) {
    }
}
