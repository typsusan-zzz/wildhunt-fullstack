package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("wh_season_pass_claim")
public class SeasonPassClaimEntity extends BaseEntity {
    private Long userId;
    private String seasonCode;
    private String rewardTrack;
    private Integer rewardLevel;
    private String rewardJson;
    private LocalDateTime claimedAt;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getSeasonCode() { return seasonCode; }
    public void setSeasonCode(String seasonCode) { this.seasonCode = seasonCode; }
    public String getRewardTrack() { return rewardTrack; }
    public void setRewardTrack(String rewardTrack) { this.rewardTrack = rewardTrack; }
    public Integer getRewardLevel() { return rewardLevel; }
    public void setRewardLevel(Integer rewardLevel) { this.rewardLevel = rewardLevel; }
    public String getRewardJson() { return rewardJson; }
    public void setRewardJson(String rewardJson) { this.rewardJson = rewardJson; }
    public LocalDateTime getClaimedAt() { return claimedAt; }
    public void setClaimedAt(LocalDateTime claimedAt) { this.claimedAt = claimedAt; }
}
