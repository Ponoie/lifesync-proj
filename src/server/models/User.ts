import mongoose, { Schema, Document, Model, type FilterQuery } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: "guest" | "user" | "premium" | "admin";
  totalCoins: number;
  avatar?: string;
  joinedAt: Date;
  lastLoginAt?: Date;
  deletedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> {
  findWithoutDeleted: (userId?: mongoose.Types.ObjectId) => Promise<IUser[]>;
  findByEmail: (email: string) => Promise<IUser | null>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["guest", "user", "premium", "admin"],
      default: "user",
    },
    totalCoins: {
      type: Number,
      default: 0,
      min: [0, "Coins cannot be negative"],
    },
    avatar: {
      type: String,
      default: "😎",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastLoginAt: {
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

// Index for soft delete and email queries
UserSchema.index({ deletedAt: 1 });
UserSchema.index({ email: 1, deletedAt: 1 });
UserSchema.index({ role: 1, deletedAt: 1 });

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: unknown) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find non-deleted users
UserSchema.statics.findWithoutDeleted = function (
  userId?: mongoose.Types.ObjectId,
) {
  const query: FilterQuery<IUser> = { deletedAt: null };
  if (userId) query._id = userId;
  return this.find(query);
};

// Static method to find user by email
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email, deletedAt: null });
};

export const User = mongoose.model<IUser, IUserModel>("User", UserSchema);
