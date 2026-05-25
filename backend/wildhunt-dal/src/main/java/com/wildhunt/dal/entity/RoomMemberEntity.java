package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("wh_room_member")
public class RoomMemberEntity extends BaseEntity {
    private Long roomId;
    private Long userId;
    private Integer seatNo;
    private String roleType;
    private Integer ready;
    private Integer ownerFlag;
    private Integer connected;
    private LocalDateTime joinedAt;
    private LocalDateTime leftAt;
    private String leaveReason;

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Integer getSeatNo() { return seatNo; }
    public void setSeatNo(Integer seatNo) { this.seatNo = seatNo; }
    public String getRoleType() { return roleType; }
    public void setRoleType(String roleType) { this.roleType = roleType; }
    public Integer getReady() { return ready; }
    public void setReady(Integer ready) { this.ready = ready; }
    public Integer getOwnerFlag() { return ownerFlag; }
    public void setOwnerFlag(Integer ownerFlag) { this.ownerFlag = ownerFlag; }
    public Integer getConnected() { return connected; }
    public void setConnected(Integer connected) { this.connected = connected; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    public LocalDateTime getLeftAt() { return leftAt; }
    public void setLeftAt(LocalDateTime leftAt) { this.leftAt = leftAt; }
    public String getLeaveReason() { return leaveReason; }
    public void setLeaveReason(String leaveReason) { this.leaveReason = leaveReason; }
}
