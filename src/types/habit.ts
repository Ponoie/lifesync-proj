export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  completedToday: boolean;
  icon?: string;
}
