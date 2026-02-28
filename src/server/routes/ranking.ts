import { Router } from 'express';
import * as rankingController from '../controllers/rankingController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Ranking routes
router.get('/ranking', asyncHandler(rankingController.getRanking));
router.get('/ranking/user/:userId', asyncHandler(rankingController.getUserRank));
router.get('/stats/overview', asyncHandler(rankingController.getPlatformStats));

export { router as rankingRouter };
