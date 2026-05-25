package com.wildhunt.service.dto;

import com.wildhunt.common.enums.RoleType;

public record StartGameResult(Long matchId, RoleType assignedRole) {
}
