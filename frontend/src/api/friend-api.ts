import { request } from './http';
import type { RoomSnapshot } from '../types/room';

export type Friend = {
  userId: string;
  username?: string;
  nickname: string;
  status: 'NONE' | 'PENDING' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED' | 'BLOCKED' | 'REJECTED';
  onlineState?: 'ONLINE' | 'MATCHING' | 'IN_ROOM' | 'PLAYING' | 'OFFLINE';
  inGame?: boolean;
  roomId?: string | number;
  matchId?: string | number;
  requesterUserId?: string | number;
  targetUserId?: string | number;
  direction?: 'RECEIVED' | 'SENT';
  source?: string;
};

export type FriendRequests = {
  received: Friend[];
  sent: Friend[];
};

export function fetchFriends() {
  return request<Friend[]>('/api/friends');
}

export function searchFriends(keyword: string) {
  return request<Friend[]>(`/api/friends/search?keyword=${encodeURIComponent(keyword)}`);
}

export function fetchFriendRequests() {
  return request<FriendRequests>('/api/friends/requests');
}

export function sendFriendRequest(username: string) {
  return request<Friend>('/api/friends/requests', { method: 'POST', body: JSON.stringify({ username }) });
}

export function sendRoomFriendRequest(roomId: string, targetUserId: string) {
  return request<Friend>('/api/friends/room-requests', { method: 'POST', body: JSON.stringify({ roomId, targetUserId }) });
}

export function acceptFriendRequest(requesterUserId: string) {
  return request<Friend>(`/api/friends/requests/${encodeURIComponent(requesterUserId)}/accept`, { method: 'POST' });
}

export function rejectFriendRequest(requesterUserId: string) {
  return request<Friend>(`/api/friends/requests/${encodeURIComponent(requesterUserId)}/reject`, { method: 'POST' });
}

export function inviteFriend(roomId: string, friendUserId: string) {
  return request<{ inviteCode: string; inviteLink: string }>('/api/invites/friend', {
    method: 'POST',
    body: JSON.stringify({ roomId, friendUserId }),
  });
}

export function acceptInvite(inviteCode: string) {
  return request<{ status: string; room: RoomSnapshot }>(`/api/invites/${encodeURIComponent(inviteCode)}/accept`, { method: 'POST' });
}

export function rejectInvite(inviteCode: string) {
  return request<{ status: string }>(`/api/invites/${encodeURIComponent(inviteCode)}/reject`, { method: 'POST' });
}
