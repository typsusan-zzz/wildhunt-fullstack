import type { EntityId } from './user';

export type FriendChatMessage = {
  id: EntityId;
  senderUserId: EntityId;
  receiverUserId: EntityId;
  peerUserId: EntityId;
  senderNickname: string;
  receiverNickname: string;
  content: string;
  read: boolean;
  createdAt: string;
};

export type FriendConversation = {
  friendUserId: EntityId;
  nickname: string;
  onlineState: 'ONLINE' | 'MATCHING' | 'IN_ROOM' | 'PLAYING' | 'OFFLINE';
  inGame: boolean;
  lastMessage: string;
  lastMessageAt?: string | null;
  unreadCount: number;
};
