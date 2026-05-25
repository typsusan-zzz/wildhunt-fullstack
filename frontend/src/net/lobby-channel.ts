import { getToken } from '../api/http';
import { WsClient } from './ws-client';

export function connectLobbyChannel(onMessage: Parameters<WsClient['connect']>[1]) {
  const client = new WsClient();
  client.connect(`/ws/lobby?token=${encodeURIComponent(getToken() ?? '')}`, onMessage);
  return client;
}
