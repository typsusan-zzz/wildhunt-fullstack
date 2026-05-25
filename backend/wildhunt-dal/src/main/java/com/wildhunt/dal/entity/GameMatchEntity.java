package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("wh_game_match")
public class GameMatchEntity extends BaseEntity {
    private Long roomId;
    private String status;
    private Long wolfUserId;
    private Integer aiDeerCount;

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getWolfUserId() { return wolfUserId; }
    public void setWolfUserId(Long wolfUserId) { this.wolfUserId = wolfUserId; }
    public Integer getAiDeerCount() { return aiDeerCount; }
    public void setAiDeerCount(Integer aiDeerCount) { this.aiDeerCount = aiDeerCount; }
}
