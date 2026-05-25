package com.wildhunt.service;

import com.wildhunt.common.util.Ids;
import com.wildhunt.service.dto.NotificationDto;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final UserService userService;
    private final Map<Long, List<MutableNotification>> notifications = new ConcurrentHashMap<>();

    public NotificationService(UserService userService) {
        this.userService = userService;
    }

    public NotificationDto push(Long userId, String type, String title, String content, Map<String, Object> payload) {
        MutableNotification item = new MutableNotification(Ids.nextId(), userId, type, title, content,
                payload == null ? Map.of() : Map.copyOf(payload), false, LocalDateTime.now());
        notifications.computeIfAbsent(userId, ignored -> new ArrayList<>()).add(item);
        userService.withUnreadCount(userId, unreadCount(userId));
        return item.toDto();
    }

    public List<NotificationDto> list(Long userId) {
        return notifications.getOrDefault(userId, List.of()).stream()
                .sorted(Comparator.comparing((MutableNotification item) -> item.createdAt).reversed())
                .map(MutableNotification::toDto)
                .toList();
    }

    public int unreadCount(Long userId) {
        return (int) notifications.getOrDefault(userId, List.of()).stream().filter(item -> !item.read).count();
    }

    public NotificationDto markRead(Long userId, Long notificationId) {
        MutableNotification item = notifications.getOrDefault(userId, List.of()).stream()
                .filter(candidate -> candidate.id.equals(notificationId))
                .findFirst()
                .orElseThrow();
        item.read = true;
        userService.withUnreadCount(userId, unreadCount(userId));
        return item.toDto();
    }

    public void markAllRead(Long userId) {
        notifications.getOrDefault(userId, List.of()).forEach(item -> item.read = true);
        userService.withUnreadCount(userId, 0);
    }

    private static final class MutableNotification {
        final Long id;
        final Long userId;
        final String type;
        final String title;
        final String content;
        final Map<String, Object> payload;
        final LocalDateTime createdAt;
        boolean read;

        MutableNotification(Long id, Long userId, String type, String title, String content,
                            Map<String, Object> payload, boolean read, LocalDateTime createdAt) {
            this.id = id;
            this.userId = userId;
            this.type = type;
            this.title = title;
            this.content = content;
            this.payload = payload;
            this.read = read;
            this.createdAt = createdAt;
        }

        NotificationDto toDto() {
            return new NotificationDto(id, userId, type, title, content, payload, read, createdAt);
        }
    }
}
