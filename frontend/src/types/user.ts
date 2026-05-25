export type EntityId = string | number;

export type UserProfile = {
  userId: EntityId;
  username: string;
  nickname: string;
  avatarUrl?: string;
  rating: number;
  level: number;
  exp: number;
  trophies: number;
  totalMatches: number;
  totalWins: number;
  title?: string;
  guideSeen: boolean;
  unreadNotifications: number;
};

export type AuthSession = {
  token: string;
  user: UserProfile;
};
