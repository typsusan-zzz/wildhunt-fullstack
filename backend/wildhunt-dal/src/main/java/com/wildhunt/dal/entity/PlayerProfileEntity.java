package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("wh_player_profile")
public class PlayerProfileEntity extends BaseEntity {
    private Long userId;
    private Integer level = 1;
    private Integer exp = 0;
    private Integer rating = 1000;
    private Integer trophies = 0;
    private Integer totalMatches = 0;
    private Integer totalWins = 0;
    private Integer guideVersion = 0;
    private Integer guideCompleted = 0;
    private String title;
    private String preferredRole;
    private Long totalPlaySeconds = 0L;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public Integer getExp() { return exp; }
    public void setExp(Integer exp) { this.exp = exp; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public Integer getTrophies() { return trophies; }
    public void setTrophies(Integer trophies) { this.trophies = trophies; }
    public Integer getTotalMatches() { return totalMatches; }
    public void setTotalMatches(Integer totalMatches) { this.totalMatches = totalMatches; }
    public Integer getTotalWins() { return totalWins; }
    public void setTotalWins(Integer totalWins) { this.totalWins = totalWins; }
    public Integer getGuideVersion() { return guideVersion; }
    public void setGuideVersion(Integer guideVersion) { this.guideVersion = guideVersion; }
    public Integer getGuideCompleted() { return guideCompleted; }
    public void setGuideCompleted(Integer guideCompleted) { this.guideCompleted = guideCompleted; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getPreferredRole() { return preferredRole; }
    public void setPreferredRole(String preferredRole) { this.preferredRole = preferredRole; }
    public Long getTotalPlaySeconds() { return totalPlaySeconds; }
    public void setTotalPlaySeconds(Long totalPlaySeconds) { this.totalPlaySeconds = totalPlaySeconds; }
}
