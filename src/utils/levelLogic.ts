export interface LevelInfo {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  progressPercent: number;
  title: string;
}

export const calculateLevel = (totalXP: number): LevelInfo => {
  const level = Math.floor(totalXP / 100) + 1;
  const currentXP = totalXP % 100;
  const xpToNextLevel = 100 - currentXP;
  const progressPercent = (currentXP / 100) * 100;

  const titles = [
    'Beginner',
    'Novice',
    'Apprentice',
    'Achiever',
    'Expert',
    'Master',
    'Grandmaster',
    'Legend',
    'Champion',
    'Hero',
  ];

  const title = titles[Math.min(level - 1, titles.length - 1)];

  return {
    level,
    currentXP,
    xpToNextLevel,
    progressPercent,
    title,
  };
};

export const calculateCoinsFromHabit = (streak: number): number => {
  // Base coin + bonus for streaks
  const base = 10;
  const streakBonus = Math.min(streak * 2, 50); // Max 50 bonus
  return base + streakBonus;
};

export const calculateCoinsFromGoal = (progress: number): number => {
  // Coins based on progress percentage
  return Math.floor(progress / 10) * 5; // 5 coins per 10% progress
};
