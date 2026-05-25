import { connectGameChannel } from '../net/game-channel';
import type { EntityId } from '../types/user';
import type { GameInputState } from './game-input-controller';

export type FormalGameOptions = {
  matchId?: EntityId;
  roomId?: EntityId;
  assignedRole?: 'WOLF' | 'DEER';
  matchSeed?: number;
  gameConfig?: Record<string, unknown>;
};

export function canEnterFormalGame(options: FormalGameOptions | undefined) {
  return Boolean(options?.matchId && options.assignedRole);
}

export type AuthoritativeGameConnection = {
  ready: Promise<void>;
  close: () => void;
};

export type ServerPlayerState = {
  userId: EntityId;
  nickname?: string;
  roleType: 'WOLF' | 'DEER';
  ai?: boolean;
  x?: number;
  z?: number;
  yaw?: number;
  dead?: boolean;
  camouflageUntil?: number;
};

export type ServerGameSnapshot = {
  serverTimeLeft?: number;
  foundReal?: number;
  realTotal?: number;
  mistakes?: number;
  players?: ServerPlayerState[];
  skillConfirm?: Record<string, unknown>;
  matchEnded?: boolean;
  wolfWin?: boolean;
};

const IDLE_INPUT_HEARTBEAT_MS = 250;

export function connectAuthoritativeGameChannel(options: {
  matchId?: EntityId;
  input: GameInputState;
  isPlaying: () => boolean;
  isCountdownLocked: () => boolean;
  setServerTick: (tick: unknown) => void;
  setServerSnapshot: (snapshot: ServerGameSnapshot, players: ServerPlayerState[]) => void;
  onMatchEnd: (result: { title?: string; detail?: string }) => void;
}): AuthoritativeGameConnection {
  if (!options.matchId) {
    return {
      ready: Promise.resolve(),
      close: () => undefined,
    };
  }
  let inputSeq = 0;
  let lastSentInputKey = '';
  let lastSentInputAt = 0;
  let firstSnapshotResolved = false;
  let resolveReady: () => void = () => {};
  let rejectReady: (error: Error) => void = () => {};
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
    window.setTimeout(() => {
      if (!firstSnapshotResolved) rejectReady(new Error('Timed out waiting for GAME_SNAPSHOT.'));
    }, 8000);
  });
  const gameChannel = connectGameChannel(options.matchId, (message) => {
    if (message.type === 'GAME_SNAPSHOT') {
      options.setServerTick(message.tick);
      const snapshot = (message.snapshot ?? {}) as ServerGameSnapshot;
      const players = ((snapshot.players ?? message.players ?? []) as ServerPlayerState[]);
      options.setServerSnapshot({ ...snapshot, players }, players);
      if (!firstSnapshotResolved) {
        firstSnapshotResolved = true;
        resolveReady();
      }
    }
    if (message.type === 'MATCH_END') {
      options.onMatchEnd((message.result ?? {}) as { title?: string; detail?: string });
    }
  });
  const inputTimer = window.setInterval(() => {
    if (!options.isPlaying()) return;
    if (options.isCountdownLocked()) return;
    const inputPayload = {
      forward: options.input.forward,
      back: options.input.back,
      left: options.input.left,
      right: options.input.right,
      sprint: options.input.sprint,
      wolfPounce: options.input.wolfPounce,
      wolfScent: options.input.wolfScent,
      deerEat: options.input.deerEat,
      deerLook: options.input.deerLook,
      deerCamouflage: options.input.deerCamouflage,
    };
    const now = performance.now();
    const inputKey = JSON.stringify(inputPayload);
    const hasActiveInput = Object.values(inputPayload).some(Boolean);
    if (!hasActiveInput && inputKey === lastSentInputKey && now - lastSentInputAt < IDLE_INPUT_HEARTBEAT_MS) return;
    lastSentInputKey = inputKey;
    lastSentInputAt = now;
    gameChannel.send({
      type: 'PLAYER_INPUT',
      matchId: String(options.matchId),
      seq: ++inputSeq,
      input: inputPayload,
    });
  }, 50);
  return {
    ready,
    close: () => {
      window.clearInterval(inputTimer);
      gameChannel.close();
    },
  };
}
