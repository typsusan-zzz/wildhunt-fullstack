package com.wildhunt.service.dto;

import com.wildhunt.common.enums.RoleType;

public record RoomMemberDto(Long userId, String nickname, RoleType roleType, boolean ready, boolean owner) {
}
