import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { healthRouter } from './routes/health';
import { testRouter } from './routes/test';
import { circuitBreakerMiddleware } from './middleware/circuitBreaker';
import { rateLimiterMiddleware } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Custom Middleware
app.use(circuitBreakerMiddleware);
app.use(rateLimiterMiddleware);

// Routes
app.use('/health', healthRouter);
app.use('/test', testRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'LifeSync API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      test: '/test',
    },
  });
});

// Error handling (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LifeSync API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoints: http://localhost:${PORT}/test`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app };
