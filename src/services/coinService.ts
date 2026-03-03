import { authService } from "./authService";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface CoinRewardRequest {
  goalId: string;
  subtasks: Array<{
    title: string;
    dueDate: string;
    completedAt?: string;
  }>;
  goalTargetDate: string;
}

export interface CoinRewardResponse {
  success: boolean;
  message: string;
  data?: {
    coinsEarned: number;
    calculation: {
      baseReward: number;
      timeBonus: number;
      speedMultiplier: number;
      totalCoins: number;
    };
    newTotalCoins: number;
    goal?: {
      _id: string;
      id?: string;
      title: string;
      description: string;
      targetDate?: string;
      completed: boolean;
      completedAt?: string;
      coinsClaimed: boolean;
      progress: number;
      subtasks?: Array<{
        title: string;
        description?: string;
        dueDate: string;
        completed: boolean;
        completedAt?: string;
      }>;
    };
  };
}

class CoinService {
  private getHeaders() {
    return {
      "Content-Type": "application/json",
      ...authService.getAuthHeader(),
    };
  }

  /**
   * Calculate coins earned for completing all subtasks
   * Based on:
   * - Base reward per subtask
   * - Time bonus (completed before due date)
   * - Speed multiplier (how fast all subtasks were completed)
   */
  calculateCoinsEarned(
    subtasks: Array<{
      title: string;
      dueDate: string;
      completedAt?: string;
    }>,
    goalTargetDate: string,
  ): {
    baseReward: number;
    timeBonus: number;
    speedMultiplier: number;
    totalCoins: number;
  } {
    const BASE_REWARD_PER_SUBTASK = 10;
    const MAX_SPEED_MULTIPLIER = 2.0;
    const MAX_TIME_BONUS_PER_SUBTASK = 5;

    let baseReward = subtasks.length * BASE_REWARD_PER_SUBTASK;
    let timeBonus = 0;
    let totalDaysSaved = 0;

    const now = new Date();
    const goalTarget = new Date(goalTargetDate);

    subtasks.forEach((subtask) => {
      if (subtask.completedAt) {
        const completedAt = new Date(subtask.completedAt);
        const dueDate = new Date(subtask.dueDate);

        // Calculate days saved (completed before due date)
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysUntilDue > 0) {
          // Bonus for completing early
          const bonus = Math.min(
            Math.round(daysUntilDue * 0.5),
            MAX_TIME_BONUS_PER_SUBTASK,
          );
          timeBonus += bonus;
          totalDaysSaved += daysUntilDue;
        }
      }
    });

    // Calculate speed multiplier based on overall completion time
    // If completed significantly before goal target date, give multiplier
    const daysUntilGoalTarget = Math.ceil(
      (goalTarget.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    let speedMultiplier = 1.0;
    if (daysUntilGoalTarget > 0) {
      // Multiplier increases with days saved, capped at MAX_SPEED_MULTIPLIER
      speedMultiplier = Math.min(
        1.0 + totalDaysSaved * 0.05,
        MAX_SPEED_MULTIPLIER,
      );
    }

    const totalCoins = Math.round((baseReward + timeBonus) * speedMultiplier);

    return {
      baseReward,
      timeBonus,
      speedMultiplier: Number.parseFloat(speedMultiplier.toFixed(2)),
      totalCoins,
    };
  }

  /**
   * Claim coins earned from completing all subtasks
   * Updates user's total coins in MongoDB
   */
  async claimCoins(request: CoinRewardRequest): Promise<CoinRewardResponse> {
    const response = await fetch(`${API_BASE}/api/coins/claim`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to claim coins");
    }

    return await response.json();
  }

  /**
   * Get user's current coin balance
   */
  async getCoinBalance(): Promise<number> {
    const token = authService.getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to get coin balance");
    }

    const result = await response.json();
    return result.data.totalCoins || 0;
  }
}

export const coinService = new CoinService();
