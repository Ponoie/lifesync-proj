import { Request, Response, NextFunction } from 'express';

interface CircuitBreakerConfig {
  threshold: number; // Number of failures before opening
  timeout: number; // Time in ms before attempting to close
  window: number; // Time window in ms to track failures
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
  resetTimeout: NodeJS.Timeout | null;
}

const ipStates = new Map<string, CircuitBreakerState>();
const config: CircuitBreakerConfig = {
  threshold: 5, // Open circuit after 5 failures
  timeout: 60000, // Try closing after 1 minute
  window: 30000, // Track failures within 30 second window
};

function resetCircuit(ip: string) {
  const state = ipStates.get(ip);
  if (state) {
    state.failures = 0;
    state.isOpen = false;
    state.lastFailureTime = 0;
    if (state.resetTimeout) {
      clearTimeout(state.resetTimeout);
      state.resetTimeout = null;
    }
    console.log(`✅ Circuit closed for IP: ${ip}`);
  }
}

export function circuitBreakerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let state = ipStates.get(ip);

  if (!state) {
    state = {
      failures: 0,
      lastFailureTime: 0,
      isOpen: false,
      resetTimeout: null,
    };
    ipStates.set(ip, state);
  }

  // Check if circuit should be reset based on window
  if (state.lastFailureTime && now - state.lastFailureTime > config.window) {
    resetCircuit(ip);
    state = ipStates.get(ip)!;
  }

  // If circuit is open, check if we should try again
  if (state.isOpen) {
    if (now - state.lastFailureTime > config.timeout) {
      // Attempt to close circuit
      console.log(`🔄 Attempting to close circuit for IP: ${ip}`);
      resetCircuit(ip);
    } else {
      // Circuit is still open, block request
      console.log(`🚫 Circuit OPEN for IP: ${ip} - Blocking request`);
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Circuit breaker is open. Too many failed requests.',
        retryAfter: Math.ceil((config.timeout - (now - state.lastFailureTime)) / 1000),
      });
    }
  }

  // Track failures (for demo, we'll track all requests as potential failures)
  // In real implementation, this would be based on actual error responses
  const originalJson = res.json;
  res.json = function(data) {
    const statusCode = (this as any).statusCode;

    // Consider 4xx and 5xx as failures
    if (statusCode >= 400) {
      state.failures++;
      state.lastFailureTime = now;

      console.log(`⚠️ Failure detected for IP: ${ip} (${state.failures}/${config.threshold})`);

      if (state.failures >= config.threshold && !state.isOpen) {
        state.isOpen = true;
        console.log(`💥 Circuit OPENED for IP: ${ip}`);

        // Set timeout to close circuit
        if (!state.resetTimeout) {
          state.resetTimeout = setTimeout(() => {
            console.log(`⏰ Circuit reset timeout reached for IP: ${ip}`);
          }, config.timeout);
        }
      }
    }

    return originalJson.call(this, data);
  };

  next();
}

// Cleanup function for graceful shutdown
export function cleanupCircuitBreaker() {
  for (const [ip, state] of ipStates.entries()) {
    if (state.resetTimeout) {
      clearTimeout(state.resetTimeout);
    }
  }
  ipStates.clear();
  console.log('🧹 Circuit breaker states cleared');
}
