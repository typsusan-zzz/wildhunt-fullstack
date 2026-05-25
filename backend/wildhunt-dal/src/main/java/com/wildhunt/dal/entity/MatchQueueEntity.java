package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("wh_match_queue")
public class MatchQueueEntity extends BaseEntity {
    private Long userId;
    private String queueType;
    private String preferredRole;
    private String status;
    private Long roomId;
    private Long matchedRoomId;
    private Long matchedMatchId;
    private LocalDateTime matchedAt;
    private LocalDateTime cancelledAt;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getQueueType() { return queueType; }
    public void setQueueType(String queueType) { this.queueType = queueType; }
    public String getPreferredRole() { return preferredRole; }
    public void setPreferredRole(String preferredRole) { this.preferredRole = preferredRole; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public Long getMatchedRoomId() { return matchedRoomId; }
    public void setMatchedRoomId(Long matchedRoomId) { this.matchedRoomId = matchedRoomId; }
    public Long getMatchedMatchId() { return matchedMatchId; }
    public void setMatchedMatchId(Long matchedMatchId) { this.matchedMatchId = matchedMatchId; }
    public LocalDateTime getMatchedAt() { return matchedAt; }
    public void setMatchedAt(LocalDateTime matchedAt) { this.matchedAt = matchedAt; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
}
