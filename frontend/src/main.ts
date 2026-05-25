import './style.css';
import { fetchCurrentMatch } from './api/match-api';
import { renderLobbyPage } from './lobby/lobby-page';
import { renderLoginPage, restoreSession } from './auth/login-page';
import { setRoute } from './ui/router';
import type { MatchSnapshot } from './types/match';
import type { EntityId, UserProfile } from './types/user';

const MATCH_OPTIONS_KEY = 'wildhunt.match.options';

const user = await restoreSession();

if (user) {
  const restoredGame = await restoreActiveGame(user);
  if (!restoredGame) renderLobbyPage(user);
} else {
  renderLoginPage((nextUser) => renderLobbyPage(nextUser));
}

type GameStartOptions = {
  userId?: EntityId;
  matchId?: EntityId;
  roomId?: EntityId;
  assignedRole: 'WOLF' | 'DEER';
  matchSeed?: number;
  gameConfig?: Record<string, unknown>;
};

async function restoreActiveGame(user: UserProfile) {
  const activeMatch = await fetchCurrentMatch().catch(() => null);
  const options = activeMatch ? gameOptionsFromMatch(activeMatch, user) : null;
  if (!options) return false;
  setRoute('game');
  window.sessionStorage.setItem(MATCH_OPTIONS_KEY, JSON.stringify(options));
  (window as unknown as { __wildhuntGameOptions?: GameStartOptions }).__wildhuntGameOptions = options;
  await import('./game/game-scene.ts');
  return true;
}

function gameOptionsFromMatch(match: MatchSnapshot, user: UserProfile): GameStartOptions | null {
  const me = match.players.find((player) => !player.ai && String(player.userId) === String(user.userId));
  if (me?.roleType !== 'WOLF' && me?.roleType !== 'DEER') return null;
  return {
    userId: user.userId,
    matchId: match.matchId,
    roomId: match.roomId,
    assignedRole: me.roleType,
    matchSeed: match.matchSeed,
    gameConfig: match.gameConfig,
  };
}
