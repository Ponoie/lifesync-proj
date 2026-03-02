import type { Request, Response, NextFunction } from "express";
import type { ObjectId } from "mongoose";
import type { UserRole } from "../../types/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "lifesync-secret-key-2024";

interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string | ObjectId;
    email?: string;
    role?: UserRole;
  };
}

// Middleware to authenticate JWT token
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as UserRole,
    };

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}

// Middleware to check if user is admin
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
}

// Optional authentication - doesn't fail if no token
export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as UserRole,
    };

    next();
  } catch (error: unknown) {
    // If token is invalid, just continue without user info
    next();
  }
}
