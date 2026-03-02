import type { Request, Response } from "express";
import { User } from "../models/User";
import { Goal } from "../models/Goal";
import { Habit } from "../models/Habit";
import mongoose from "mongoose";

// GET /api/admin/users - Get all users with their stats
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.findWithoutDeleted();

    // Get stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const userId = user._id;

        // Count goals
        const totalGoals = await Goal.countDocuments({
          userId,
          deletedAt: null,
        });

        const completedGoals = await Goal.countDocuments({
          userId,
          completed: true,
          deletedAt: null,
        });

        // Count habits
        const totalHabits = await Habit.countDocuments({
          userId,
          deletedAt: null,
        });

        const completedHabitsToday = await Habit.countDocuments({
          userId,
          completedToday: true,
          deletedAt: null,
        });

        return {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          totalCoins: user.totalCoins,
          avatar: user.avatar,
          joinedAt: user.joinedAt,
          lastLoginAt: user.lastLoginAt,
          stats: {
            totalGoals,
            completedGoals,
            totalHabits,
            completedHabitsToday,
          },
        };
      }),
    );

    res.json({
      success: true,
      count: usersWithStats.length,
      data: usersWithStats,
    });
  } catch (error: unknown) {
    console.error("[GET ALL USERS] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// GET /api/admin/users/:id - Get detailed user info
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's goals
    const goals = await Goal.find({ userId: user._id, deletedAt: null });

    // Get user's habits
    const habits = await Habit.find({ userId: user._id, deletedAt: null });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          totalCoins: user.totalCoins,
          avatar: user.avatar,
          joinedAt: user.joinedAt,
          lastLoginAt: user.lastLoginAt,
        },
        goals: goals.map((goal) => ({
          id: goal._id,
          title: goal.title,
          description: goal.description,
          progress: goal.progress,
          completed: goal.completed,
          createdAt: goal.createdAt,
        })),
        habits: habits.map((habit) => ({
          id: habit._id,
          name: habit.name,
          frequency: habit.frequency,
          streak: habit.streak,
          completedToday: habit.completedToday,
        })),
      },
    });
  } catch (error: unknown) {
    console.error("[GET USER BY ID] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// PUT /api/admin/users/:id/coins - Update user coins
export const updateUserCoins = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;
    const { amount, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (typeof amount !== "number") {
      return res.status(400).json({
        success: false,
        message: "Amount must be a number",
      });
    }

    const user = await User.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update coins
    user.totalCoins += amount;
    if (user.totalCoins < 0) user.totalCoins = 0;
    await user.save();

    res.json({
      success: true,
      message: "Coins updated successfully",
      data: {
        userId: user._id,
        previousCoins: user.totalCoins - amount,
        newCoins: user.totalCoins,
        amount,
        reason: reason || "Admin adjustment",
      },
    });
  } catch (error: unknown) {
    console.error("[UPDATE USER COINS] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// DELETE /api/admin/users/:id - Soft delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from deleting themselves
    const currentUserId = req.user?.id;
    const currentUserIdStr =
      typeof currentUserId === "string" || currentUserId === undefined
        ? currentUserId
        : currentUserId.toString();

    if (user._id.toString() === currentUserIdStr) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    user.deletedAt = new Date();
    await user.save();

    // Soft delete user's goals and habits
    await Goal.updateMany({ userId: user._id }, { deletedAt: new Date() });
    await Habit.updateMany({ userId: user._id }, { deletedAt: new Date() });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: unknown) {
    console.error("[DELETE USER] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// GET /api/admin/stats - Get platform statistics
export const getPlatformStats = async (_req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({ deletedAt: null });
    const totalGoals = await Goal.countDocuments({ deletedAt: null });
    const totalHabits = await Habit.countDocuments({ deletedAt: null });
    const completedGoals = await Goal.countDocuments({
      completed: true,
      deletedAt: null,
    });

    const totalCoins = await User.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: null, total: { $sum: "$totalCoins" } } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalGoals,
        totalHabits,
        completedGoals,
        totalCoins: totalCoins[0]?.total || 0,
        avgGoalsPerUser: totalGoals / totalUsers || 0,
        avgHabitsPerUser: totalHabits / totalUsers || 0,
      },
    });
  } catch (error: unknown) {
    console.error("[GET PLATFORM STATS] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};
