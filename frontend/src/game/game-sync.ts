import { connectGameChannel } from '../net/game-channel';
import type { ServerMessage } from '../net/protocol';
import type { EntityId } from '../types/user';

export function startGameSync(matchId?: EntityId) {
  return connectGameChannel(matchId, (message: ServerMessage) => {
    window.dispatchEvent(new CustomEvent('wildhunt:game-message', { detail: message }));
  });
}
