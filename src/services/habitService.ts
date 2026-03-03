import axios from "axios";
import type { Habit } from "../types/habit";
import { authService } from "./authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface HabitCoinCalculation {
  baseReward: number;
  streakBonus: number;
  frequencyMultiplier: number;
  totalCoins: number;
}

export interface ClaimHabitCoinsResponse {
  success: boolean;
  message: string;
  data: {
    coinsEarned: number;
    calculation: HabitCoinCalculation;
    newTotalCoins: number;
    habit: {
      _id: string;
      id: string;
      name: string;
      description?: string;
      frequency: string;
      streak: number;
      completedToday: boolean;
      coinsClaimed: boolean;
      completedAt?: string;
    };
  };
}

export interface ToggleHabitResponse {
  success: boolean;
  data: {
    _id: string;
    id: string;
    name: string;
    description?: string;
    frequency: string;
    streak: number;
    completedToday: boolean;
    lastCompletedAt?: string;
    icon?: string;
    coinsClaimed?: boolean;
    completedAt?: string;
  };
}

export interface FetchHabitsResponse {
  success: boolean;
  count: number;
  data: {
    _id: string;
    id: string;
    name: string;
    description?: string;
    frequency: string;
    streak: number;
    completedToday: boolean;
    lastCompletedAt?: string;
    icon?: string;
    coinsClaimed?: boolean;
    completedAt?: string;
  }[];
}

/**
 * Calculate coins earned for completing a habit
 * Base rate: 5 coins for daily, 10 for weekly, 20 for monthly
 * Streak bonus: 1 coin per streak level (max 10 bonus)
 * Frequency multiplier: daily x1, weekly x1.5, monthly x2
 */
export function calculateHabitCoins(
  frequency: "daily" | "weekly" | "monthly",
  streak: number,
): HabitCoinCalculation {
  const BASE_REWARDS = {
    daily: 5,
    weekly: 10,
    monthly: 20,
  };

  const FREQUENCY_MULTIPLIERS = {
    daily: 1.0,
    weekly: 1.5,
    monthly: 2.0,
  };

  const MAX_STREAK_BONUS = 10;

  const baseReward = BASE_REWARDS[frequency];
  const streakBonus = Math.min(streak, MAX_STREAK_BONUS);
  const frequencyMultiplier = FREQUENCY_MULTIPLIERS[frequency];

  const totalCoins = Math.round(
    (baseReward + streakBonus) * frequencyMultiplier,
  );

  return {
    baseReward,
    streakBonus,
    frequencyMultiplier,
    totalCoins,
  };
}

/**
 * Toggle habit completion status
 */
export async function toggleHabit(
  habitId: string,
): Promise<ToggleHabitResponse> {
  const token = authService.getToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await axios.post(
    `${API_URL}/habits/${habitId}/toggle`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

/**
 * Fetch all habits for the current user
 */
export async function fetchHabits(): Promise<FetchHabitsResponse> {
  const token = authService.getToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await axios.get(`${API_URL}/habits`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/**
 * Fetch ALL habits (including completed ones for history)
 */
export async function fetchAllHabits(): Promise<FetchHabitsResponse> {
  const token = authService.getToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await axios.get(`${API_URL}/habits/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/**
 * Create a new habit
 */
export async function createHabit(data: {
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly";
  icon?: string;
}): Promise<{ success: boolean; data: Habit }> {
  const token = authService.getToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await axios.post(`${API_URL}/habits`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/**
 * Claim coins earned from completing a habit
 */
export async function claimHabitCoins(
  habitId: string,
  frequency: "daily" | "weekly" | "monthly",
  streak: number,
): Promise<ClaimHabitCoinsResponse> {
  const token = authService.getToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await axios.post(
    `${API_URL}/habits/${habitId}/claim-coins`,
    { frequency, streak },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}
