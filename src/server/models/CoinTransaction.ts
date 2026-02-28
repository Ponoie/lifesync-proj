import mongoose, { Schema, Document } from 'mongoose';

export interface ICoinTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: 'earned' | 'spent' | 'bonus' | 'penalty';
  reason: string;
  relatedGoalId?: mongoose.Types.ObjectId;
  relatedHabitId?: mongoose.Types.ObjectId;
  deletedAt?: Date;
}

const CoinTransactionSchema = new Schema<ICoinTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    type: {
      type: String,
      enum: ['earned', 'spent', 'bonus', 'penalty'],
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      minlength: [3, 'Reason must be at least 3 characters'],
      maxlength: [100, 'Reason cannot exceed 100 characters'],
    },
    relatedGoalId: {
      type: Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },
    relatedHabitId: {
      type: Schema.Types.ObjectId,
      ref: 'Habit',
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for user transaction history
CoinTransactionSchema.index({ userId: 1, createdAt: -1, deletedAt: 1 });
CoinTransactionSchema.index({ type: 1, deletedAt: 1 });

// Static method to find non-deleted transactions
CoinTransactionSchema.statics.findWithoutDeleted = function (userId?: mongoose.Types.ObjectId) {
  const query: any = { deletedAt: null };
  if (userId) query.userId = userId;
  return this.find(query).sort({ createdAt: -1 });
};

export const CoinTransaction = mongoose.model<ICoinTransaction>('CoinTransaction', CoinTransactionSchema);
