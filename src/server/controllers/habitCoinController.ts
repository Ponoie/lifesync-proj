import type { Request, Response } from "express";
import { User } from "../models/User";
import { Habit } from "../models/Habit";
import { CoinTransaction } from "../models/CoinTransaction";
import mongoose from "mongoose";

interface HabitCoinRequest {
  frequency: "daily" | "weekly" | "monthly";
  streak: number;
}

// POST /api/habits/:habitId/claim-coins - Claim coins earned from completing a habit
export const claimHabitCoins = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { habitId } = req.params;
    const { frequency, streak }: HabitCoinRequest = req.body;

    // Validate input
    if (!habitId || !frequency || streak === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify the habit belongs to the user
    const userIdObj =
      typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

    const habit = await Habit.findOne({
      _id: habitId,
      userId: userIdObj,
      deletedAt: null,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: "Habit not found",
      });
    }

    // Calculate coins earned
    const calculation = calculateHabitCoins(frequency, streak);

    // Update user's total coins
    const user = await User.findOne({ _id: userIdObj, deletedAt: null });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const previousBalance = user.totalCoins;
    user.totalCoins += calculation.totalCoins;
    await user.save();

    // Mark habit as coins claimed and set completedAt and lastClaimedAt
    habit.coinsClaimed = true;
    habit.completedAt = new Date();
    habit.lastClaimedAt = new Date();

    await habit.save();

    // Create transaction record
    await CoinTransaction.create({
      userId: userIdObj,
      amount: calculation.totalCoins,
      type: "earned",
      reason: `Completed ${frequency} habit: ${habit.name} (${streak} day streak)`,
      source: "habit_complete",
      relatedHabitId: habit._id,
      previousBalance,
      newBalance: user.totalCoins,
    });

    res.json({
      success: true,
      message: `Congratulations! You earned ${calculation.totalCoins} coins!`,
      data: {
        coinsEarned: calculation.totalCoins,
        calculation,
        newTotalCoins: user.totalCoins,
        habit: {
          _id: habit._id,
          id: habit._id?.toString(),
          name: habit.name,
          description: habit.description,
          frequency: habit.frequency,
          streak: habit.streak,
          completedToday: habit.completedToday,
          coinsClaimed: habit.coinsClaimed,
          completedAt: habit.completedAt?.toISOString(),
        },
      },
    });
  } catch (error: unknown) {
    console.error("[CLAIM HABIT COINS] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Calculate coins earned for completing a habit
 * Base rate: 5 coins for daily, 10 for weekly, 20 for monthly
 * Streak bonus: 1 coin per streak level (max 10 bonus)
 * Frequency multiplier: daily x1, weekly x1.5, monthly x2
 */
function calculateHabitCoins(
  frequency: "daily" | "weekly" | "monthly",
  streak: number,
): {
  baseReward: number;
  streakBonus: number;
  frequencyMultiplier: number;
  totalCoins: number;
} {
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
    frequencyMultiplier: Number.parseFloat(frequencyMultiplier.toFixed(2)),
    totalCoins,
  };
}
