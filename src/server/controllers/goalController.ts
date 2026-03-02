import type { Request, Response } from "express";
import { Goal } from "../models/Goal";
import { CoinTransaction } from "../models/CoinTransaction";
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

// GET /api/goals - Get all goals for a user
export const getGoals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // From auth middleware
    console.log("[GET GOALS] userId:", userId);

    // For now, if no userId, get all goals (for development without auth)
    // TODO: Remove this when proper auth is implemented
    let goals;
    if (userId) {
      console.log("[GET GOALS] Fetching goals for user:", userId);
      goals = await Goal.findWithoutDeleted(toObjectId(userId));
    } else {
      console.log("[GET GOALS] No userId, fetching all goals");
      goals = await Goal.find({ deletedAt: null }).sort({ createdAt: -1 });
    }

    console.log("[GET GOALS] Found", goals.length, "goals");
    console.log(
      "[GET GOALS] Goals:",
      goals.map((g: { _id: mongoose.Types.ObjectId; title: string }) => ({
        id: g._id,
        title: g.title,
      })),
    );

    res.json({
      success: true,
      count: goals.length,
      data: goals,
    });
  } catch (error: unknown) {
    console.error("[GET GOALS] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// GET /api/goals/:id - Get single goal
export const getGoalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const goalId = Array.isArray(id) ? id[0] : id;

    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goal ID",
      });
    }

    const goal = await Goal.findOne({ _id: goalId, deletedAt: null });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    res.json({
      success: true,
      data: goal,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// POST /api/goals - Create new goal
export const createGoal = async (req: Request, res: Response) => {
  console.log("[CREATE GOAL] Request body:", req.body);
  try {
    const userId = req.user?.id;
    const { title, description, targetDate, milestones, subtasks } = req.body;

    console.log("[CREATE GOAL] userId:", userId);
    console.log("[CREATE GOAL] title:", title);
    console.log("[CREATE GOAL] description:", description);
    console.log("[CREATE GOAL] targetDate:", targetDate);
    console.log("[CREATE GOAL] subtasks count:", subtasks?.length || 0);

    // Validation
    if (!title || title.length < 3) {
      console.log("[CREATE GOAL] Validation failed: title too short");
      return res.status(400).json({
        success: false,
        message: "Title must be at least 3 characters",
      });
    }

    if (!description || description.length < 10) {
      console.log("[CREATE GOAL] Validation failed: description too short");
      return res.status(400).json({
        success: false,
        message: "Description must be at least 10 characters",
      });
    }

    // Create goal data
    const goalData: {
      title: string;
      description: string;
      targetDate: Date | null;
      milestones: Array<{ title: string; completed: boolean }>;
      subtasks: Array<{
        title: string;
        description?: string;
        startDate?: string;
        dueDate: string;
        completed: boolean;
      }>;
      progress: number;
      completed: boolean;
      userId?: mongoose.Types.ObjectId;
    } = {
      title,
      description,
      targetDate: targetDate || null,
      milestones: milestones || [],
      subtasks: subtasks || [],
      progress: 0,
      completed: false,
    };

    // Only add userId if it exists (for development without auth)
    if (userId) {
      goalData.userId = toObjectId(userId)!;
    }

    console.log("[CREATE GOAL] Creating goal with data:", goalData);

    const goal = await Goal.create(goalData);

    console.log("[CREATE GOAL] Goal created successfully:", goal._id);

    res.status(201).json({
      success: true,
      data: goal,
    });
  } catch (error: unknown) {
    console.error("[CREATE GOAL] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// PUT /api/goals/:id - Update goal
export const updateGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const goalId = Array.isArray(id) ? id[0] : id;
    const { title, description, targetDate, progress, milestones, subtasks } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goal ID",
      });
    }

    const goal = await Goal.findOne({ _id: goalId, deletedAt: null });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    // Update fields
    if (title) goal.title = title;
    if (description) goal.description = description;
    if (targetDate !== undefined) goal.targetDate = targetDate;
    if (progress !== undefined) {
      goal.progress = Math.max(0, Math.min(100, progress));
      goal.completed = goal.progress === 100;
      if (goal.completed && !goal.completedAt) {
        goal.completedAt = new Date();
      }
    }
    if (milestones) goal.milestones = milestones;
    if (subtasks) goal.subtasks = subtasks;

    await goal.save();

    res.json({
      success: true,
      data: goal,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// DELETE /api/goals/:id - Soft delete goal
export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const goalId = Array.isArray(id) ? id[0] : id;

    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goal ID",
      });
    }

    const goal = await Goal.findOne({ _id: goalId, deletedAt: null });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    // Soft delete
    goal.deletedAt = new Date();
    await goal.save();

    res.json({
      success: true,
      message: "Goal deleted successfully",
      data: { id: goal._id },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// POST /api/goals/:id/complete - Atomic update: Complete goal with coins
export const completeGoal = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const goalId = Array.isArray(id) ? id[0] : id;

    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goal ID",
      });
    }

    session.startTransaction();

    // Find goal
    const goal = await Goal.findOne({ _id: goalId, deletedAt: null }).session(
      session,
    );

    if (!goal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    if (goal.completed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Goal already completed",
      });
    }

    // Calculate coins (1 coin per 10% progress)
    const coinsEarned = Math.floor(goal.progress / 10) * 5;

    // Update goal
    goal.completed = true;
    goal.completedAt = new Date();
    goal.progress = 100;
    await goal.save({ session });

    // Create coin transaction
    await CoinTransaction.create(
      [
        {
          userId: toObjectId(userId)!,
          amount: coinsEarned,
          type: "earned",
          reason: `Completed goal: ${goal.title}`,
          relatedGoalId: goal._id,
        },
      ],
      { session },
    );

    // Update user coins (would update User model in real implementation)
    // For now, return the coins earned

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: `Goal completed! You earned ${coinsEarned} coins!`,
      data: {
        goal,
        coinsEarned,
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
