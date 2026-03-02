import type { Request, Response } from "express";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// JWT Secret (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || "lifesync-secret-key-2024";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

// Helper function to generate JWT token
function generateToken(user: {
  _id: mongoose.Types.ObjectId;
  email: string;
  role: string;
}): string {
  const payload: JWTPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
  );
}

// POST /api/auth/register - Register new user
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    // Validate input
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password, and username",
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      username,
      role: "user",
      totalCoins: 0,
    });

    // Generate token
    const token = generateToken(user);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          totalCoins: user.totalCoins,
          avatar: user.avatar,
        },
      },
    });
  } catch (error: unknown) {
    console.error("[REGISTER] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// POST /api/auth/login - Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email, deletedAt: null }).select(
      "+password",
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          totalCoins: user.totalCoins,
          avatar: user.avatar,
        },
      },
    });
  } catch (error: unknown) {
    console.error("[LOGIN] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// GET /api/auth/me - Get current user info
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const userIdObj =
      typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

    const user = await User.findOne({ _id: userIdObj, deletedAt: null });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        totalCoins: user.totalCoins,
        avatar: user.avatar,
        joinedAt: user.joinedAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error: unknown) {
    console.error("[GET CURRENT USER] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// POST /api/auth/seed-admin - Seed admin user (for development)
export const seedAdmin = async (_req: Request, res: Response) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findByEmail("admin@gmail.com");
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin user already exists",
      });
    }

    // Create admin user
    const admin = await User.create({
      email: "admin@gmail.com",
      password: "admin1234", // Will be hashed automatically
      username: "Admin",
      role: "admin",
      totalCoins: 9999,
      avatar: "👑",
    });

    res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      data: {
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error: unknown) {
    console.error("[SEED ADMIN] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};
