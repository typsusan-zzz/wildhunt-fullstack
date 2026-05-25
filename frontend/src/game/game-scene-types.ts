import * as THREE from 'three';
import type { EntityId } from '../types/user';

export type Role = 'wolf' | 'deer';
export type Phase = 'menu' | 'playing' | 'result';
export type DeerState = 'wander' | 'pause' | 'graze' | 'look' | 'startled' | 'dead';
export type AnimalKind = 'wolf' | 'deer';
export type AnimalClip = 'idle' | 'walk' | 'gallop' | 'eat' | 'attack' | 'death';
export type NatureCategory = 'tree' | 'bush' | 'grass' | 'rock' | 'mushroom' | 'plant' | 'cliff';
export type ColliderCategory = 'tree' | 'rock' | 'cliff' | 'bush' | 'animal' | 'terrain-blocker';
export type SurfaceKind = 'trunk' | 'foliage' | 'rock' | 'grass' | 'unknown';

export type Collider = {
  id: number;
  category: ColliderCategory;
  center: THREE.Vector2;
  radius: number;
  height: number;
  object?: THREE.Object3D;
  blocks: boolean;
};

export type MoveOptions = {
  radius: number;
  height: number;
  maxStepUp: number;
  maxDropDown: number;
  maxSlope: number;
  arenaRadius: number;
  ignore?: THREE.Object3D;
};

export type PlaceMode = 'center' | 'average' | 'lowest';

export type PlaceOnTerrainOptions = {
  mode?: PlaceMode;
  offset?: number;
  samples?: number;
  bury?: number;
  keepUpright?: boolean;
};

export type AnimalAnimator = {
  mixer: THREE.AnimationMixer;
  actions: Partial<Record<AnimalClip, THREE.AnimationAction>>;
  active?: AnimalClip;
  speed: number;
};

export type NatureAssetSpec = {
  url: string;
  height: number;
};

export type Deer = {
  id: number;
  serverUserId?: EntityId;
  group: THREE.Group;
  velocity: THREE.Vector3;
  state: DeerState;
  stateTime: number;
  wanderAngle: number;
  speed: number;
  hunger: number;
  suspicion: number;
  isReal: boolean;
  isPlayer: boolean;
  isDecoy?: boolean;
  decoyExpireAt?: number;
  decoyOwnerUserId?: EntityId;
  markedUntil: number;
};

export type MatchState = {
  phase: Phase;
  role: Role;
  timeLeft: number;
  maxTime: number;
  foundReal: number;
  realTotal: number;
  mistakes: number;
  stamina: number;
  scentUsed: boolean;
  deerDecoyUsed: boolean;
  resultTitle: string;
  resultDetail: string;
};

export type GameStartOptions = {
  userId?: EntityId;
  matchId?: EntityId;
  roomId?: EntityId;
  assignedRole?: 'WOLF' | 'DEER';
  matchSeed?: number;
  gameConfig?: Record<string, unknown>;
};
