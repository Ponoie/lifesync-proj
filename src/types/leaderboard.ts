export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  totalCoins: number;
  level: number;
  completedGoals: number;
  habitStreak: number;
  isCurrentUser?: boolean;
}
