import { useState } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { calculateLevel } from '../utils/levelLogic';
import type { LeaderboardEntry } from '../types/leaderboard';

const sampleLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: '1',
    username: 'Sarah Champion',
    avatar: '👩‍💻',
    totalCoins: 2580,
    level: 26,
    completedGoals: 45,
    habitStreak: 30,
  },
  {
    rank: 2,
    userId: '2',
    username: 'Mike Achiever',
    avatar: '👨‍🎓',
    totalCoins: 2340,
    level: 24,
    completedGoals: 38,
    habitStreak: 21,
  },
  {
    rank: 3,
    userId: '3',
    username: 'Emma GoalDigger',
    avatar: '👩‍🚀',
    totalCoins: 2100,
    level: 21,
    completedGoals: 32,
    habitStreak: 15,
  },
  {
    rank: 4,
    userId: '4',
    username: 'You',
    avatar: '😎',
    totalCoins: 250,
    level: 3,
    completedGoals: 1,
    habitStreak: 5,
    isCurrentUser: true,
  },
  {
    rank: 5,
    userId: '5',
    username: 'John Starter',
    avatar: '👨‍💼',
    totalCoins: 180,
    level: 2,
    completedGoals: 2,
    habitStreak: 3,
  },
];

export function LeaderboardPage() {
  const theme = useThemeStore((state) => state.theme);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'goals' | 'habits'>('all');

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-orange-400';
      default:
        return theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}
        >
          🏆 Leaderboard
        </h1>
        <div className="flex gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="all">All</option>
            <option value="goals">Goals</option>
            <option value="habits">Habits</option>
          </select>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {sampleLeaderboard.slice(0, 3).map((entry, index) => {
          const height = index === 0 ? 'h-40' : index === 1 ? 'h-32' : 'h-28';
          const bgColor = entry.isCurrentUser
            ? 'bg-blue-600'
            : index === 0
            ? 'bg-yellow-100 border-yellow-400'
            : index === 1
            ? 'bg-gray-100 border-gray-300'
            : 'bg-orange-100 border-orange-300';

          return (
            <div
              key={entry.userId}
              className={`${height} ${bgColor} border-2 rounded-t-lg flex flex-col items-center justify-center p-4`}
            >
              <span className="text-4xl mb-2">{getRankIcon(entry.rank)}</span>
              <span className="text-2xl mb-1">{entry.avatar}</span>
              <span
                className={`font-bold text-sm mb-1 ${
                  theme === 'dark' ? 'text-gray-800' : 'text-gray-800'
                }`}
              >
                {entry.username}
              </span>
              <span className="text-xs font-medium text-gray-600">
                {entry.totalCoins} coins
              </span>
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard */}
      <div
        className={`rounded-lg border overflow-hidden ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        {/* Table Header */}
        <div
          className={`grid grid-cols-12 gap-4 p-4 border-b font-semibold text-sm ${
            theme === 'dark'
              ? 'bg-gray-900 border-gray-700 text-gray-300'
              : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}
        >
          <div className="col-span-1">Rank</div>
          <div className="col-span-3">User</div>
          <div className="col-span-2 text-right">Coins</div>
          <div className="col-span-2 text-center">Level</div>
          <div className="col-span-2 text-center">Goals</div>
          <div className="col-span-2 text-center">Streak</div>
        </div>

        {/* Table Rows */}
        {sampleLeaderboard.map((entry) => {
          const levelInfo = calculateLevel(entry.totalCoins);
          return (
            <div
              key={entry.userId}
              className={`grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 items-center transition-colors ${
                entry.isCurrentUser
                  ? 'bg-blue-50 border-blue-200'
                  : theme === 'dark'
                  ? 'border-gray-700 hover:bg-gray-750'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`col-span-1 font-bold ${getRankColor(entry.rank)}`}>
                {getRankIcon(entry.rank)}
              </div>
              <div className="col-span-3 flex items-center gap-3">
                <span className="text-2xl">{entry.avatar}</span>
                <div>
                  <p
                    className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {entry.username}
                  </p>
                  {entry.isCurrentUser && (
                    <span className="text-xs text-blue-600 font-medium">
                      You
                    </span>
                  )}
                </div>
              </div>
              <div className="col-span-2 text-right">
                <span
                  className={`font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {entry.totalCoins.toLocaleString()}
                </span>
                <span
                  className={`text-xs ml-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  🪙
                </span>
              </div>
              <div className="col-span-2 text-center">
                <div
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <span>Lvl {entry.level}</span>
                  <span className="text-xs text-gray-500">
                    {levelInfo.title}
                  </span>
                </div>
              </div>
              <div className="col-span-2 text-center">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    theme === 'dark'
                      ? 'bg-green-900 text-green-300'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  ✓ {entry.completedGoals}
                </span>
              </div>
              <div className="col-span-2 text-center">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    theme === 'dark'
                      ? 'bg-orange-900 text-orange-300'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  🔥 {entry.habitStreak}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivational Message */}
      <div
        className={`mt-6 p-4 rounded-lg border text-center ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-blue-50 border-blue-200'
        }`}
      >
        <p
          className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          💡 <strong>Tip:</strong> Complete goals and maintain habit streaks to
          climb the leaderboard! Every coin counts!
        </p>
      </div>
    </div>
  );
}
