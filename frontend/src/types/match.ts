export type QueueType = 'WOLF' | 'DEER' | 'AUTO';

export type MatchStatus = 'PLAYING' | 'FINISHED' | 'CANCELLED';

export type RoleType = 'WOLF' | 'DEER' | 'SPECTATOR';

export type MatchGameConfig = {
  realDeerCount?: number;
  aiDeerCount?: number;
  durationSeconds?: number;
  initialTime?: number;
  maxTime?: number;
  correctBonus?: number;
  wrongPenalty?: number;
  scentCooldownSeconds?: number;
  biteCooldownSeconds?: number;
  deerLookCooldownSeconds?: number;
  deerLookDurationSeconds?: number;
  deerCamouflageDurationSeconds?: number;
  deerCamouflageCooldownSeconds?: number;
  deerEatDurationSeconds?: number;
  scentDurationSeconds?: number;
  wolfSpeed?: number;
  deerSpeed?: number;
  wolfBaseSpeed?: number;
  wolfSprintSpeed?: number;
  deerBaseSpeed?: number;
  deerSprintSpeed?: number;
  arenaRadius?: number;
  worldRadius?: number;
  sceneryRadius?: number;
  turnSpeed?: number;
  maxWalkableSlope?: number;
  foodPatchCount?: number;
  foodSpawnRadius?: number;
  deerSpawnRadius?: number;
  deerWanderArenaRadius?: number;
  natureDensityMultiplier?: number;
  [key: string]: unknown;
};

export type MatchPlayerSnapshot = {
  userId: number;
  nickname: string;
  roleType: RoleType;
  ai: boolean;
};

export type MatchSnapshot = {
  matchId: number;
  roomId?: number;
  status: MatchStatus | string;
  matchSeed: number;
  gameConfig: MatchGameConfig;
  players: MatchPlayerSnapshot[];
};

export type LeaderboardEntry = {
  rank: number;
  userId: string | number;
  nickname: string;
  leaderboardType?: 'TROPHY' | 'WINS' | 'RATING' | string;
  score?: number;
  rating: number;
  level?: number;
  trophies?: number;
  wins: number;
  wolfWins: number;
  deerSurvivals: number;
};
