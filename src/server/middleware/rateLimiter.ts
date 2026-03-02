import type { Request, Response, NextFunction } from "express";

interface RateLimiterConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitState {
  count: number;
  resetTime: number;
}

const ipRequests = new Map<string, RateLimitState>();
const config: RateLimiterConfig = {
  windowMs: 60000, // 1 minute window
  maxRequests: 100, // 100 requests per minute
};

export function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  let state = ipRequests.get(ip);

  if (!state || now > state.resetTime) {
    // Create new window or reset existing
    state = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    ipRequests.set(ip, state);
    return next();
  }

  // Check if limit exceeded
  if (state.count >= config.maxRequests) {
    const retryAfter = Math.ceil((state.resetTime - now) / 1000);

    console.log(`🚫 Rate limit exceeded for IP: ${ip}`);
    console.log(`   Requests: ${state.count}/${config.maxRequests}`);
    console.log(`   Retry after: ${retryAfter}s`);

    return res.status(429).json({
      error: "Too Many Requests",
      message: `Rate limit exceeded. Please try again later.`,
      retryAfter: `${retryAfter} seconds`,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: new Date(state.resetTime).toISOString(),
    });
  }

  // Increment counter
  state.count++;

  // Add rate limit info to response headers
  res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
  res.setHeader(
    "X-RateLimit-Remaining",
    (config.maxRequests - state.count).toString(),
  );
  res.setHeader("X-RateLimit-Reset", new Date(state.resetTime).toISOString());

  next();
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, state] of ipRequests.entries()) {
    if (now > state.resetTime) {
      ipRequests.delete(ip);
    }
  }
}, config.windowMs);

export function getRateLimitStats() {
  return {
    totalIps: ipRequests.size,
    config,
    entries: Array.from(ipRequests.entries()).map(([ip, state]) => ({
      ip,
      count: state.count,
      resetTime: new Date(state.resetTime).toISOString(),
    })),
  };
}
