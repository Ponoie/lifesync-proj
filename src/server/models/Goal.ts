import mongoose, { Schema, Document, Model, type FilterQuery } from "mongoose";

export interface IGoal extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  targetDate?: Date;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  coinsClaimed?: boolean;
  milestones: Array<{
    title: string;
    completed: boolean;
    completedAt?: Date;
  }>;
  subtasks: Array<{
    title: string;
    description?: string;
    startDate?: Date;
    dueDate: Date;
    completed: boolean;
    completedAt?: Date;
  }>;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGoalModel extends Model<IGoal> {
  findWithoutDeleted: (userId?: mongoose.Types.ObjectId) => Promise<IGoal[]>;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    targetDate: {
      type: Date,
      default: null,
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, "Progress cannot be negative"],
      max: [100, "Progress cannot exceed 100"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    coinsClaimed: {
      type: Boolean,
      default: false,
    },
    milestones: [
      {
        title: {
          type: String,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
          default: null,
        },
      },
    ],
    subtasks: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          default: "",
        },
        startDate: {
          type: Date,
          default: null,
        },
        dueDate: {
          type: Date,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
          default: null,
        },
      },
    ],
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
GoalSchema.index({ userId: 1, deletedAt: 1 });
GoalSchema.index({ completed: 1, deletedAt: 1 });

// Static method to find non-deleted goals
GoalSchema.statics.findWithoutDeleted = function (
  userId?: mongoose.Types.ObjectId,
) {
  const query: FilterQuery<IGoal> = { deletedAt: null };
  if (userId) query.userId = userId;
  return this.find(query);
};

export const Goal = mongoose.model<IGoal, IGoalModel>("Goal", GoalSchema);
