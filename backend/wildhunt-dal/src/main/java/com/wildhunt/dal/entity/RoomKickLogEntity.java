package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("wh_room_kick_log")
public class RoomKickLogEntity extends BaseEntity {
    private Long roomId;
    private Long operatorUserId;
    private Long targetUserId;
    private String reason;

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public Long getOperatorUserId() { return operatorUserId; }
    public void setOperatorUserId(Long operatorUserId) { this.operatorUserId = operatorUserId; }
    public Long getTargetUserId() { return targetUserId; }
    public void setTargetUserId(Long targetUserId) { this.targetUserId = targetUserId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
