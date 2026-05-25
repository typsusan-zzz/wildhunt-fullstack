package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("wh_activity_claim")
public class ActivityClaimEntity extends BaseEntity {
    private Long activityId;
    private Long userId;
    private String rewardJson;
    private LocalDateTime claimedAt;

    public Long getActivityId() { return activityId; }
    public void setActivityId(Long activityId) { this.activityId = activityId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getRewardJson() { return rewardJson; }
    public void setRewardJson(String rewardJson) { this.rewardJson = rewardJson; }
    public LocalDateTime getClaimedAt() { return claimedAt; }
    public void setClaimedAt(LocalDateTime claimedAt) { this.claimedAt = claimedAt; }
}
