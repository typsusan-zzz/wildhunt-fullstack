package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("wh_match_player")
public class MatchPlayerEntity extends BaseEntity {
    private Long matchId;
    private Long userId;
    private String roleType;
    private String result;
    private Integer scoreDelta;
    private Integer expDelta;
    private Integer trophyDelta;
    private Integer survived;
    private Integer killCount;
    private Integer foodEaten;
    private Integer skillUseCount;

    public Long getMatchId() { return matchId; }
    public void setMatchId(Long matchId) { this.matchId = matchId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getRoleType() { return roleType; }
    public void setRoleType(String roleType) { this.roleType = roleType; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public Integer getScoreDelta() { return scoreDelta; }
    public void setScoreDelta(Integer scoreDelta) { this.scoreDelta = scoreDelta; }
    public Integer getExpDelta() { return expDelta; }
    public void setExpDelta(Integer expDelta) { this.expDelta = expDelta; }
    public Integer getTrophyDelta() { return trophyDelta; }
    public void setTrophyDelta(Integer trophyDelta) { this.trophyDelta = trophyDelta; }
    public Integer getSurvived() { return survived; }
    public void setSurvived(Integer survived) { this.survived = survived; }
    public Integer getKillCount() { return killCount; }
    public void setKillCount(Integer killCount) { this.killCount = killCount; }
    public Integer getFoodEaten() { return foodEaten; }
    public void setFoodEaten(Integer foodEaten) { this.foodEaten = foodEaten; }
    public Integer getSkillUseCount() { return skillUseCount; }
    public void setSkillUseCount(Integer skillUseCount) { this.skillUseCount = skillUseCount; }
}
