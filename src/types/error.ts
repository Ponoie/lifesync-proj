export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    "statusCode" in error &&
    typeof (error as ApiError).statusCode === "number"
  );
}
