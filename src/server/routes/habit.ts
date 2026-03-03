import { Router } from "express";
import { claimHabitCoins } from "../controllers/habitCoinController";
import { authenticate } from "../middleware/auth";

const router = Router();

// All habit routes require authentication
router.use(authenticate);

// POST /api/habits/:habitId/claim-coins - Claim coins for completing a habit
router.post("/:habitId/claim-coins", claimHabitCoins);

export { router as habitRouter };
