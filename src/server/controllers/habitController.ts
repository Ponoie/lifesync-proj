import type { Request, Response } from "express";
import { Habit, IHabit } from "../models/Habit";
import { CoinTransaction } from "../models/CoinTransaction";
import { calculateCoinsFromHabit } from "../../utils/levelLogic";
import mongoose from "mongoose";

// Helper function to convert userId to ObjectId
function toObjectId(
  userId:
    | string
    | mongoose.Types.ObjectId
    | mongoose.Schema.Types.ObjectId
    | undefined,
): mongoose.Types.ObjectId | undefined {
  if (!userId) return undefined;
  if (typeof userId === "string") {
    return new mongoose.Types.ObjectId(userId);
  }
  // Handle both Types.ObjectId and Schema.Types.ObjectId
  return new mongoose.Types.ObjectId(userId.toString());
}

/**
 * Check if habit is ready to be shown based on its frequency and last claim time
 * Returns true if the habit should be visible and actionable
 */
function isHabitReady(habit: IHabit): boolean {
  // If never claimed, always show
  if (!habit.lastClaimedAt) {
    return true;
  }

  const now = new Date();
  const lastClaimed = new Date(habit.lastClaimedAt);
  const timeDiff = now.getTime() - lastClaimed.getTime();

  // Calculate time thresholds in milliseconds
  const DAY = 24 * 60 * 60 * 1000;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY; // Approximate as 30 days

  switch (habit.frequency) {
    case "daily":
      // Show if at least 1 day has passed
      return timeDiff >= DAY;
    case "weekly":
      // Show if at least 1 week has passed
      return timeDiff >= WEEK;
    case "monthly":
      // Show if at least 1 month has passed
      return timeDiff >= MONTH;
    default:
      return true;
  }
}

// GET /api/habits - Get all habits for a user (only ready habits)
export const getHabits = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const allHabits = await Habit.findWithoutDeleted(toObjectId(userId));

    // Filter habits that are ready to be shown
    const readyHabits = allHabits.filter(isHabitReady);

    // Reset habits that are now ready (clear completed status)
    const habitsToReset = readyHabits.filter((h) => h.coinsClaimed);
    for (const habit of habitsToReset) {
      habit.completedToday = false;
      habit.coinsClaimed = false;
      await habit.save();
    }

    res.json({
      success: true,
      count: readyHabits.length,
      data: readyHabits,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// GET /api/habits/all - Get ALL habits for a user (including completed ones for history)
export const getAllHabits = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const allHabits = await Habit.findWithoutDeleted(toObjectId(userId));

    res.json({
      success: true,
      count: allHabits.length,
      data: allHabits,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// POST /api/habits - Create new habit
export const createHabit = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, description, frequency, icon } = req.body;

    if (!name || name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    const habit = await Habit.create({
      userId: toObjectId(userId)!,
      name,
      description,
      frequency: frequency || "daily",
      icon: icon || "⭐",
      streak: 0,
      completedToday: false,
    });

    res.status(201).json({
      success: true,
      data: habit,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// POST /api/habits/:id/toggle - Toggle habit completion status (without awarding coins)
export const toggleHabit = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const habitId = Array.isArray(id) ? id[0] : id;

    if (!mongoose.Types.ObjectId.isValid(habitId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid habit ID",
      });
    }

    // Find habit
    const habit = await Habit.findOne({
      _id: habitId,
      userId: toObjectId(userId),
      deletedAt: null,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: "Habit not found",
      });
    }

    // Don't allow toggling if coins already claimed and not yet reset
    if (habit.coinsClaimed && !isHabitReady(habit)) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify habit after coins have been claimed. Wait for the next cycle.",
      });
    }

    // Toggle completion
    const wasCompleted = habit.completedToday;
    habit.completedToday = !wasCompleted;

    // Update streak accordingly
    if (!wasCompleted) {
      // Completing the habit
      habit.streak += 1;
      habit.lastCompletedAt = new Date();
    } else {
      // Uncompleting the habit
      habit.streak = Math.max(0, habit.streak - 1);
    }

    await habit.save();

    res.json({
      success: true,
      data: habit,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// POST /api/habits/:id/complete - Atomic update: Complete habit with coins
export const completeHabit = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const habitId = Array.isArray(id) ? id[0] : id;

    if (!mongoose.Types.ObjectId.isValid(habitId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid habit ID",
      });
    }

    session.startTransaction();

    // Find habit
    const habit = await Habit.findOne({
      _id: habitId,
      deletedAt: null,
    }).session(session);

    if (!habit) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Habit not found",
      });
    }

    if (habit.completedToday) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Habit already completed today",
      });
    }

    // Calculate coins
    const coinsEarned = calculateCoinsFromHabit(habit.streak);

    // Update habit
    habit.completedToday = true;
    habit.streak += 1;
    habit.lastCompletedAt = new Date();
    await habit.save({ session });

    // Create coin transaction
    await CoinTransaction.create(
      [
        {
          userId: toObjectId(userId)!,
          amount: coinsEarned,
          type: "earned",
          reason: `Completed habit: ${habit.name} (${habit.streak} day streak)`,
          relatedHabitId: habit._id,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: `Habit completed! You earned ${coinsEarned} coins! 🎉`,
      data: {
        habit,
        coinsEarned,
        newStreak: habit.streak,
      },
    });
  } catch (error: unknown) {
    await session.abortTransaction();
    session.endSession();

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// DELETE /api/habits/:id - Soft delete habit
export const deleteHabit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const habitId = Array.isArray(id) ? id[0] : id;

    if (!mongoose.Types.ObjectId.isValid(habitId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid habit ID",
      });
    }

    const habit = await Habit.findOne({ _id: habitId, deletedAt: null });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: "Habit not found",
      });
    }

    habit.deletedAt = new Date();
    await habit.save();

    res.json({
      success: true,
      message: "Habit deleted successfully",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};
