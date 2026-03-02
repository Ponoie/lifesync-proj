import type { ObjectId } from "mongoose";
import type { UserRole } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string | ObjectId;
        email?: string;
        role?: UserRole;
      };
    }
  }
}

export {};
