package com.wildhunt.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("wh_room_chat_message")
public class RoomChatMessageEntity extends BaseEntity {
    private Long roomId;
    private Long userId;
    private String messageType;
    private String content;

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
