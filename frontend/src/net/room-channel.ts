import { getToken } from '../api/http';
import { WsClient } from './ws-client';
import type { EntityId } from '../types/user';

export function connectRoomChannel(roomId: EntityId, onMessage: Parameters<WsClient['connect']>[1]) {
  const client = new WsClient();
  const roomKey = String(roomId);
  const socket = client.connect(`/ws/room?roomId=${encodeURIComponent(roomKey)}&token=${encodeURIComponent(getToken() ?? '')}`, onMessage);
  socket.addEventListener('open', () => client.send({ type: 'JOIN_ROOM', roomId: roomKey, token: getToken() ?? '' }));
  const heartbeat = window.setInterval(() => client.send({ type: 'PING', roomId: roomKey, sentAt: Date.now() }), 10000);
  socket.addEventListener('close', () => window.clearInterval(heartbeat));
  return client;
}
