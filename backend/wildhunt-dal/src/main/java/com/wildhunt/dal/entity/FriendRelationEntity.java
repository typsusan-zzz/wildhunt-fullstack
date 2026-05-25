package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("wh_friend_relation")
public class FriendRelationEntity extends BaseEntity {
    private Long userId;
    private Long friendUserId;
    private String status;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getFriendUserId() { return friendUserId; }
    public void setFriendUserId(Long friendUserId) { this.friendUserId = friendUserId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
