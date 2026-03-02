import type { Request, Response, NextFunction } from "express";
import type { ApiError } from "../../types/error";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error("❌ Error occurred:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing authentication token",
    });
  }

  // Default error response
  const apiError = err as ApiError;
  const statusCode = apiError.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: err.name || "Error",
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
