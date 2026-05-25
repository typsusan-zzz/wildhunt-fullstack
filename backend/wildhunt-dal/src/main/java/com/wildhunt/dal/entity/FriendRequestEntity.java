package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("wh_friend_request")
public class FriendRequestEntity extends BaseEntity {
    private Long fromUserId;
    private Long toUserId;
    private String status;
    private String message;

    public Long getFromUserId() { return fromUserId; }
    public void setFromUserId(Long fromUserId) { this.fromUserId = fromUserId; }
    public Long getToUserId() { return toUserId; }
    public void setToUserId(Long toUserId) { this.toUserId = toUserId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
