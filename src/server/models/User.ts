import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'guest' | 'user' | 'premium' | 'admin';
  totalCoins: number;
  avatar?: string;
  joinedAt: Date;
  deletedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['guest', 'user', 'premium', 'admin'],
      default: 'user',
    },
    totalCoins: {
      type: Number,
      default: 0,
      min: [0, 'Coins cannot be negative'],
    },
    avatar: {
      type: String,
      default: '😎',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
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

// Index for soft delete
UserSchema.index({ deletedAt: 1 });

// Static method to find non-deleted users
UserSchema.statics.findWithoutDeleted = function () {
  return this.find({ deletedAt: null });
};

export const User = mongoose.model<IUser>('User', UserSchema);
