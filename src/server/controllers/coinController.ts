import type { Request, Response } from "express";
import { User } from "../models/User";
import { Goal } from "../models/Goal";
import { CoinTransaction } from "../models/CoinTransaction";
import mongoose from "mongoose";

interface CoinRewardRequest {
  goalId: string;
  subtasks: Array<{
    title: string;
    dueDate: string;
    completedAt?: string;
  }>;
  goalTargetDate: string;
}

// POST /api/coins/claim - Claim coins earned from completing all subtasks
export const claimCoins = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { goalId, subtasks, goalTargetDate }: CoinRewardRequest = req.body;

    // Validate input
    if (!goalId || !subtasks || !goalTargetDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify the goal belongs to the user
    const userIdObj =
      typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

    const goal = await Goal.findOne({
      _id: goalId,
      userId: userIdObj,
      deletedAt: null,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    // Calculate coins earned
    const calculation = calculateCoinsEarned(subtasks, goalTargetDate);

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

    // Mark goal as coins claimed
    goal.coinsClaimed = true;
    await goal.save();

    // Create transaction record
    await CoinTransaction.create({
      userId: userIdObj,
      amount: calculation.totalCoins,
      type: "earned",
      reason: `Completed all subtasks for goal: ${goal.title}`,
      source: "subtask_complete",
      relatedGoalId: goal._id,
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
        goal: {
          _id: goal._id,
          id: goal._id?.toString(),
          title: goal.title,
          description: goal.description,
          targetDate: goal.targetDate,
          completed: goal.completed,
          completedAt: goal.completedAt,
          coinsClaimed: goal.coinsClaimed,
          progress: goal.progress,
          subtasks: goal.subtasks,
        },
      },
    });
  } catch (error: unknown) {
    console.error("[CLAIM COINS] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Calculate coins earned for completing all subtasks
 * Uses same logic as frontend to ensure consistency
 */
function calculateCoinsEarned(
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
