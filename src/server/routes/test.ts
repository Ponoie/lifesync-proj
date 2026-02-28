import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Test endpoint for circuit breaker
router.get('/fail', asyncHandler(async (req, res) => {
  // Simulate a failure
  throw new Error('Simulated failure for circuit breaker testing');
}));

router.get('/slow', asyncHandler(async (req, res) => {
  // Simulate slow response
  await new Promise(resolve => setTimeout(resolve, 2000));
  res.json({ message: 'Slow response completed', delay: '2000ms' });
}));

router.get('/success', asyncHandler(async (req, res) => {
  res.json({
    message: 'Success',
    timestamp: new Date().toISOString(),
    random: Math.random(),
  });
}));

// Endpoint to trigger rate limiting
router.get('/spam', asyncHandler(async (req, res) => {
  res.json({
    message: 'Request processed',
    timestamp: new Date().toISOString(),
  });
}));

export { router as testRouter };
