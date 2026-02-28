import { Request, Response } from 'express';
import { Habit } from '../models/Habit';
import { CoinTransaction } from '../models/CoinTransaction';
import { calculateCoinsFromHabit } from '../../utils/levelLogic';
import mongoose from 'mongoose';

// GET /api/habits - Get all habits for a user
export const getHabits = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const habits = await Habit.findWithoutDeleted(new mongoose.Types.ObjectId(userId));

    res.json({
      success: true,
      count: habits.length,
      data: habits,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
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
        message: 'Name must be at least 2 characters',
      });
    }

    const habit = await Habit.create({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      description,
      frequency: frequency || 'daily',
      icon: icon || '⭐',
      streak: 0,
      completedToday: false,
    });

    res.status(201).json({
      success: true,
      data: habit,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/habits/:id/complete - Atomic update: Complete habit with coins
export const completeHabit = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid habit ID',
      });
    }

    session.startTransaction();

    // Find habit
    const habit = await Habit.findOne({ _id: id, deletedAt: null }).session(session);

    if (!habit) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    if (habit.completedToday) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Habit already completed today',
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
    await CoinTransaction.create([
      {
        userId: new mongoose.Types.ObjectId(userId),
        amount: coinsEarned,
        type: 'earned',
        reason: `Completed habit: ${habit.name} (${habit.streak} day streak)`,
        relatedHabitId: habit._id,
      },
    ], { session });

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
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/habits/:id - Soft delete habit
export const deleteHabit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid habit ID',
      });
    }

    const habit = await Habit.findOne({ _id: id, deletedAt: null });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    habit.deletedAt = new Date();
    await habit.save();

    res.json({
      success: true,
      message: 'Habit deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
