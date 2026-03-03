export interface Habit {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly";
  streak: number;
  completedToday: boolean;
  lastCompletedAt?: string;
  icon?: string;
  coinsClaimed?: boolean; // Track if coins have been claimed for completed habit
  completedAt?: string; // When the habit was completed (for history)
  lastClaimedAt?: string; // When coins were last claimed (for resetting habits)
}
