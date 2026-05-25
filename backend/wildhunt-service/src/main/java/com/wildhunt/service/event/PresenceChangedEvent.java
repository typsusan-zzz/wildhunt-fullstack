package com.wildhunt.service.event;

import com.wildhunt.service.PlayerPresenceService;

public record PresenceChangedEvent(Long userId, PlayerPresenceService.PresenceState state) {
}
