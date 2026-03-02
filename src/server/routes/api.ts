import { Router } from "express";
import * as goalController from "../controllers/goalController";
import * as habitController from "../controllers/habitController";
import { asyncHandler } from "../middleware/errorHandler";
import { authenticate } from "../middleware/auth";

const router = Router();

// Goal routes (all require authentication)
router.get("/goals", authenticate, asyncHandler(goalController.getGoals));
router.get(
  "/goals/:id",
  authenticate,
  asyncHandler(goalController.getGoalById),
);
router.post("/goals", authenticate, asyncHandler(goalController.createGoal));
router.put("/goals/:id", authenticate, asyncHandler(goalController.updateGoal));
router.delete(
  "/goals/:id",
  authenticate,
  asyncHandler(goalController.deleteGoal),
);
router.post(
  "/goals/:id/complete",
  authenticate,
  asyncHandler(goalController.completeGoal),
);

// Habit routes (all require authentication)
router.get("/habits", authenticate, asyncHandler(habitController.getHabits));
router.post("/habits", authenticate, asyncHandler(habitController.createHabit));
router.post(
  "/habits/:id/complete",
  authenticate,
  asyncHandler(habitController.completeHabit),
);
router.delete(
  "/habits/:id",
  authenticate,
  asyncHandler(habitController.deleteHabit),
);

export { router as apiRouter };
