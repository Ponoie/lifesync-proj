import { Router } from "express";
import * as coinController from "../controllers/coinController";
import { asyncHandler } from "../middleware/errorHandler";
import { authenticate } from "../middleware/auth";

const router = Router();

// Coin routes (all require authentication)
router.post("/claim", authenticate, asyncHandler(coinController.claimCoins));

export { router as coinRouter };
