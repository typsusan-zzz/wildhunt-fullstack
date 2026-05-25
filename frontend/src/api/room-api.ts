import { request } from './http';
import type { RoomChatMessage, RoomSnapshot } from '../types/room';
import type { EntityId } from '../types/user';

export function createRoom(name: string) {
  return request<RoomSnapshot>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ name, maxPlayers: 10, aiDeerCount: 16, publicRoom: true }),
  });
}

export function joinRoom(roomId: EntityId) {
  return request<RoomSnapshot>(`/api/rooms/${String(roomId)}/join`, { method: 'POST' });
}

export function joinRoomByCode(inviteCode: string) {
  return request<RoomSnapshot>(`/api/rooms/join-by-code/${encodeURIComponent(inviteCode)}`, { method: 'POST' });
}

export function fetchCurrentRoom() {
  return request<RoomSnapshot | null>('/api/rooms/current');
}

export function leaveRoom(roomId: EntityId) {
  return request<RoomSnapshot>(`/api/rooms/${String(roomId)}/leave`, { method: 'POST' });
}

export function kickRoomMember(roomId: EntityId, targetUserId: EntityId, reason = '') {
  return request<RoomSnapshot>(`/api/rooms/${String(roomId)}/kick`, {
    method: 'POST',
    body: JSON.stringify({ targetUserId, reason }),
  });
}

export function setReady(roomId: EntityId, ready: boolean) {
  return request<RoomSnapshot>(`/api/rooms/${String(roomId)}/ready`, { method: 'POST', body: JSON.stringify({ ready }) });
}

export function startRoom(roomId: EntityId) {
  return request<{ matchId: EntityId; assignedRole: 'WOLF' | 'DEER' }>(`/api/rooms/${String(roomId)}/start`, { method: 'POST' });
}

export function fetchRoomChat(roomId: EntityId, limit = 30) {
  return request<RoomChatMessage[]>(`/api/rooms/${String(roomId)}/chat?limit=${limit}`);
}

export function sendRoomChat(roomId: EntityId, content: string) {
  return request<RoomChatMessage>(`/api/rooms/${String(roomId)}/chat`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
