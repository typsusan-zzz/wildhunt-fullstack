import { request } from './http';
import type { FriendChatMessage, FriendConversation } from '../types/chat';
import type { EntityId } from '../types/user';

export function fetchFriendConversations() {
  return request<FriendConversation[]>('/api/chats/friends');
}

export function fetchFriendChat(friendUserId: EntityId, limit = 50) {
  return request<FriendChatMessage[]>(`/api/chats/friends/${String(friendUserId)}?limit=${limit}`);
}

export function sendFriendChat(friendUserId: EntityId, content: string) {
  return request<FriendChatMessage>(`/api/chats/friends/${String(friendUserId)}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function markFriendChatRead(friendUserId: EntityId) {
  return request<{ readCount: number }>(`/api/chats/friends/${String(friendUserId)}/read`, { method: 'POST' });
}
