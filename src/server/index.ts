import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDatabase, isConnected } from "./config/database";
import { healthRouter } from "./routes/health";
import { testRouter } from "./routes/test";
import { authRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";
import { apiRouter } from "./routes/api";
import { rankingRouter } from "./routes/ranking";
import { circuitBreakerMiddleware } from "./middleware/circuitBreaker";
import { rateLimiterMiddleware } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// Custom Middleware
app.use(circuitBreakerMiddleware);
app.use(rateLimiterMiddleware);

// Routes
app.use("/health", healthRouter);
app.use("/test", testRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api", apiRouter);
app.use("/api", rankingRouter);

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    message: "LifeSync API",
    version: "1.0.0",
    status: "operational",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      healthDetailed: "/health/detailed",
      test: "/test",
    },
  });
});

// Error handling (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to MongoDB (will use mock mode if not available)
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 LifeSync API Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test endpoints: http://localhost:${PORT}/test`);
      console.log(`📡 API endpoints: http://localhost:${PORT}/api`);
      console.log(`🏆 Ranking: http://localhost:${PORT}/api/ranking`);
      console.log(
        `💾 MongoDB: ${isConnected() ? "✅ Connected" : "⚠️ Mock Mode (no database)"}`,
      );
      console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export { app };
