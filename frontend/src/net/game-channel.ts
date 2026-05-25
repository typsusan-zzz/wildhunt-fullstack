import { WsClient } from './ws-client';
import { getToken } from '../api/http';
import type { EntityId } from '../types/user';

export function connectGameChannel(matchId: EntityId | undefined, onMessage: Parameters<WsClient['connect']>[1]) {
  const client = new WsClient();
  client.connect(`/ws/game?matchId=${encodeURIComponent(String(matchId ?? ''))}&token=${encodeURIComponent(getToken() ?? '')}`, onMessage);
  return client;
}
