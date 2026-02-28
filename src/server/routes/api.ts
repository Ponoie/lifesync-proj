import { Router } from 'express';
import * as goalController from '../controllers/goalController';
import * as habitController from '../controllers/habitController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Goal routes
router.get('/goals', asyncHandler(goalController.getGoals));
router.get('/goals/:id', asyncHandler(goalController.getGoalById));
router.post('/goals', asyncHandler(goalController.createGoal));
router.put('/goals/:id', asyncHandler(goalController.updateGoal));
router.delete('/goals/:id', asyncHandler(goalController.deleteGoal));
router.post('/goals/:id/complete', asyncHandler(goalController.completeGoal));

// Habit routes
router.get('/habits', asyncHandler(habitController.getHabits));
router.post('/habits', asyncHandler(habitController.createHabit));
router.post('/habits/:id/complete', asyncHandler(habitController.completeHabit));
router.delete('/habits/:id', asyncHandler(habitController.deleteHabit));

export { router as apiRouter };
