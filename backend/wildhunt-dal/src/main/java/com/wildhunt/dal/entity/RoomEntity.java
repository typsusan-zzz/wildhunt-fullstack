package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("wh_room")
public class RoomEntity extends BaseEntity {
    private String roomCode;
    private String name;
    private Long ownerUserId;
    private String status;
    private String roomType;
    private Integer maxPlayers;
    private Integer aiDeerCount;
    private Integer publicRoom;
    private Long currentMatchId;
    private LocalDateTime closedAt;
    private Integer version;

    public String getRoomCode() { return roomCode; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(Long ownerUserId) { this.ownerUserId = ownerUserId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }
    public Integer getMaxPlayers() { return maxPlayers; }
    public void setMaxPlayers(Integer maxPlayers) { this.maxPlayers = maxPlayers; }
    public Integer getAiDeerCount() { return aiDeerCount; }
    public void setAiDeerCount(Integer aiDeerCount) { this.aiDeerCount = aiDeerCount; }
    public Integer getPublicRoom() { return publicRoom; }
    public void setPublicRoom(Integer publicRoom) { this.publicRoom = publicRoom; }
    public Long getCurrentMatchId() { return currentMatchId; }
    public void setCurrentMatchId(Long currentMatchId) { this.currentMatchId = currentMatchId; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
}
