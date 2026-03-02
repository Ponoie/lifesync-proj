import { Router } from "express";
import * as adminController from "../controllers/adminController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// User management
router.get("/users", asyncHandler(adminController.getAllUsers));
router.get("/users/:id", asyncHandler(adminController.getUserById));
router.put("/users/:id/coins", asyncHandler(adminController.updateUserCoins));
router.delete("/users/:id", asyncHandler(adminController.deleteUser));

// Platform statistics
router.get("/stats", asyncHandler(adminController.getPlatformStats));

export { router as adminRouter };
