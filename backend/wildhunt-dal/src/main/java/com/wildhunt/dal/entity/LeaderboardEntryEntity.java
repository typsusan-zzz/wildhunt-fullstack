package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("wh_leaderboard_entry")
public class LeaderboardEntryEntity extends BaseEntity {
    private String seasonCode;
    private Long userId;
    private Integer rating = 1000;
    private Integer wins = 0;
    private Integer wolfWins = 0;
    private Integer deerSurvivals = 0;

    public String getSeasonCode() { return seasonCode; }
    public void setSeasonCode(String seasonCode) { this.seasonCode = seasonCode; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public Integer getWins() { return wins; }
    public void setWins(Integer wins) { this.wins = wins; }
    public Integer getWolfWins() { return wolfWins; }
    public void setWolfWins(Integer wolfWins) { this.wolfWins = wolfWins; }
    public Integer getDeerSurvivals() { return deerSurvivals; }
    public void setDeerSurvivals(Integer deerSurvivals) { this.deerSurvivals = deerSurvivals; }
}
