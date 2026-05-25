import type { EntityId } from './user';

export type RewardPreview = {
  day: number;
  exp: number;
  assetCode?: string | null;
  claimed: boolean;
};

export type CheckinStatus = {
  claimedToday: boolean;
  streakDays: number;
  totalDays: number;
  rewards: RewardPreview[];
  serverDate: string;
};

export type Activity = {
  id: EntityId;
  code: string;
  title: string;
  description: string;
  activityType: 'LOGIN' | 'MATCH_COMPLETE' | 'FRIEND_INVITE' | 'WIN_COUNT' | 'TROPHY_COUNT';
  reward: Record<string, unknown>;
  condition: string;
  progress: number;
  target: number;
  claimable: boolean;
  claimed: boolean;
  expired: boolean;
  startsAt: string;
  endsAt: string;
};

export type SeasonPassReward = {
  track: 'FREE' | 'PREMIUM';
  level: number;
  label: string;
  reward: Record<string, unknown>;
  claimable: boolean;
  claimed: boolean;
  locked: boolean;
};

export type SeasonPassStatus = {
  seasonCode: string;
  seasonName: string;
  level: number;
  exp: number;
  expIntoLevel: number;
  expForNextLevel: number;
  progressPercent: number;
  maxLevel: number;
  premiumUnlocked: boolean;
  freeRewards: SeasonPassReward[];
  premiumRewards: SeasonPassReward[];
};

export type NotificationItem = {
  id: EntityId;
  userId: EntityId;
  type: 'SYSTEM' | 'ROOM_INVITE' | 'FRIEND_REQUEST' | 'FRIEND_CHAT' | 'ACTIVITY_REWARD' | 'RANK_CHANGE' | 'MATCH_RESULT' | 'OWNER_TRANSFER' | 'KICKED_FROM_ROOM';
  title: string;
  content: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

export type UserAsset = {
  assetType: string;
  assetCode: string;
  equipped: boolean;
  source: string;
};
