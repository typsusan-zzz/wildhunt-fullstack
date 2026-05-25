package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("wh_season_pass_progress")
public class SeasonPassProgressEntity extends BaseEntity {
    private Long userId;
    private String seasonCode;
    private Integer seasonExp;
    private Integer level;
    private Integer premiumUnlocked;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getSeasonCode() { return seasonCode; }
    public void setSeasonCode(String seasonCode) { this.seasonCode = seasonCode; }
    public Integer getSeasonExp() { return seasonExp; }
    public void setSeasonExp(Integer seasonExp) { this.seasonExp = seasonExp; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public Integer getPremiumUnlocked() { return premiumUnlocked; }
    public void setPremiumUnlocked(Integer premiumUnlocked) { this.premiumUnlocked = premiumUnlocked; }
}
