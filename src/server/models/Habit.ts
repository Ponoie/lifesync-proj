import mongoose, { Schema, Document, Model, type FilterQuery } from "mongoose";

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly";
  streak: number;
  completedToday: boolean;
  lastCompletedAt?: Date;
  icon?: string;
  coinsClaimed?: boolean; // Track if coins have been claimed for completed habit
  completedAt?: Date; // When the habit was completed (for history)
  lastClaimedAt?: Date; // When coins were last claimed (for resetting habits)
  deletedAt?: Date;
}

export interface IHabitModel extends Model<IHabit> {
  findWithoutDeleted: (userId?: mongoose.Types.ObjectId) => Promise<IHabit[]>;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    name: {
      type: String,
      required: [true, "Habit name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
      required: true,
    },
    streak: {
      type: Number,
      default: 0,
      min: [0, "Streak cannot be negative"],
    },
    completedToday: {
      type: Boolean,
      default: false,
    },
    lastCompletedAt: {
      type: Date,
      default: null,
    },
    icon: {
      type: String,
      default: "⭐",
    },
    coinsClaimed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastClaimedAt: {
      type: Date,
      default: null,
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

// Index for soft delete and user queries
HabitSchema.index({ userId: 1, deletedAt: 1 });
HabitSchema.index({ frequency: 1, deletedAt: 1 });

// Static method to find non-deleted habits
HabitSchema.statics.findWithoutDeleted = function (
  userId?: mongoose.Types.ObjectId,
) {
  const query: FilterQuery<IHabit> = { deletedAt: null };
  if (userId) query.userId = userId;
  return this.find(query);
};

export const Habit = mongoose.model<IHabit, IHabitModel>("Habit", HabitSchema);
