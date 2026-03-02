import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
  seedAdmin,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/seed-admin", seedAdmin); // Only for development

// Protected routes
router.get("/me", authenticate, getCurrentUser);

export { router as authRouter };
