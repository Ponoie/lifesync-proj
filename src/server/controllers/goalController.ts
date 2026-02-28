import { Request, Response } from 'express';
import { Goal } from '../models/Goal';
import { CoinTransaction } from '../models/CoinTransaction';
import mongoose from 'mongoose';

// GET /api/goals - Get all goals for a user
export const getGoals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // From auth middleware

    const goals = await Goal.findWithoutDeleted(new mongoose.Types.ObjectId(userId));

    res.json({
      success: true,
      count: goals.length,
      data: goals,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/goals/:id - Get single goal
export const getGoalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID',
      });
    }

    const goal = await Goal.findOne({ _id: id, deletedAt: null });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    res.json({
      success: true,
      data: goal,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/goals - Create new goal
export const createGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, description, targetDate, milestones } = req.body;

    // Validation
    if (!title || title.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 3 characters',
      });
    }

    if (!description || description.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters',
      });
    }

    const goal = await Goal.create({
      userId: new mongoose.Types.ObjectId(userId),
      title,
      description,
      targetDate: targetDate || null,
      milestones: milestones || [],
      progress: 0,
      completed: false,
    });

    res.status(201).json({
      success: true,
      data: goal,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT /api/goals/:id - Update goal
export const updateGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, targetDate, progress, milestones } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID',
      });
    }

    const goal = await Goal.findOne({ _id: id, deletedAt: null });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
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

    await goal.save();

    res.json({
      success: true,
      data: goal,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/goals/:id - Soft delete goal
export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID',
      });
    }

    const goal = await Goal.findOne({ _id: id, deletedAt: null });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    // Soft delete
    goal.deletedAt = new Date();
    await goal.save();

    res.json({
      success: true,
      message: 'Goal deleted successfully',
      data: { id: goal._id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/goals/:id/complete - Atomic update: Complete goal with coins
export const completeGoal = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID',
      });
    }

    session.startTransaction();

    // Find goal
    const goal = await Goal.findOne({ _id: id, deletedAt: null }).session(session);

    if (!goal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    if (goal.completed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Goal already completed',
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
    await CoinTransaction.create([
      {
        userId: new mongoose.Types.ObjectId(userId),
        amount: coinsEarned,
        type: 'earned',
        reason: `Completed goal: ${goal.title}`,
        relatedGoalId: goal._id,
      },
    ], { session });

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
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
