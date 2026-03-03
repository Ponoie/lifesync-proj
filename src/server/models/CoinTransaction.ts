import mongoose, { Schema, Document } from "mongoose";

export interface ICoinTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: "earned" | "spent" | "bonus" | "penalty";
  reason: string;
  source?: string; // e.g., "goal_complete", "subtask_complete", "admin_bonus"
  relatedGoalId?: mongoose.Types.ObjectId;
  relatedHabitId?: mongoose.Types.ObjectId;
  previousBalance: number; // Balance before this transaction
  newBalance: number; // Balance after this transaction
  deletedAt?: Date;
  createdAt: Date;
}

const CoinTransactionSchema = new Schema<ICoinTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    type: {
      type: String,
      enum: ["earned", "spent", "bonus", "penalty"],
      required: true,
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      minlength: [3, "Reason must be at least 3 characters"],
      maxlength: [100, "Reason cannot exceed 100 characters"],
    },
    source: {
      type: String,
      // e.g., "goal_complete", "subtask_complete", "admin_bonus", "shop_purchase"
    },
    relatedGoalId: {
      type: Schema.Types.ObjectId,
      ref: "Goal",
      default: null,
    },
    relatedHabitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      default: null,
    },
    previousBalance: {
      type: Number,
      required: [true, "Previous balance is required"],
      default: 0,
    },
    newBalance: {
      type: Number,
      required: [true, "New balance is required"],
      default: 0,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
CoinTransactionSchema.index({ userId: 1, createdAt: -1, deletedAt: 1 });
CoinTransactionSchema.index({ type: 1, deletedAt: 1 });
CoinTransactionSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Static method to find non-deleted transactions
CoinTransactionSchema.statics.findWithoutDeleted = function (
  userId?: mongoose.Types.ObjectId,
  limit = 50,
) {
  const query: any = { deletedAt: null };
  if (userId) query.userId = userId;
  return this.find(query).sort({ createdAt: -1 }).limit(limit);
};

// Static method to get user's transaction stats
CoinTransactionSchema.statics.getUserStats = function (
  userId: mongoose.Types.ObjectId,
) {
  return this.aggregate([
    {
      $match: {
        userId,
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);
};

// Static method to get total earned for a user
CoinTransactionSchema.statics.getUserTotalEarned = function (
  userId: mongoose.Types.ObjectId,
) {
  return this.aggregate([
    {
      $match: {
        userId,
        type: { $in: ["earned", "bonus"] },
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]).then((result) => result[0]?.total || 0);
};

// Static method to get total spent by a user
CoinTransactionSchema.statics.getUserTotalSpent = function (
  userId: mongoose.Types.ObjectId,
) {
  return this.aggregate([
    {
      $match: {
        userId,
        type: "spent",
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]).then((result) => result[0]?.total || 0);
};

export const CoinTransaction = mongoose.model<ICoinTransaction>(
  "CoinTransaction",
  CoinTransactionSchema,
);
