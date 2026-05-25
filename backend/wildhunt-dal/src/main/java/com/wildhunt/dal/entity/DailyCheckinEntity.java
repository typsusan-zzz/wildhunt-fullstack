package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDate;

@TableName("wh_daily_checkin")
public class DailyCheckinEntity extends BaseEntity {
    private Long userId;
    private LocalDate checkinDate;
    private Integer streakDays;
    private Integer rewardExp;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDate getCheckinDate() { return checkinDate; }
    public void setCheckinDate(LocalDate checkinDate) { this.checkinDate = checkinDate; }
    public Integer getStreakDays() { return streakDays; }
    public void setStreakDays(Integer streakDays) { this.streakDays = streakDays; }
    public Integer getRewardExp() { return rewardExp; }
    public void setRewardExp(Integer rewardExp) { this.rewardExp = rewardExp; }
}
