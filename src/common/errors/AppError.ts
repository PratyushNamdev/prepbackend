export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational = true;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const errors = {
  badRequest: (message: string, details?: unknown) => new AppError(400, "BAD_REQUEST", message, details),
  unauthorized: (message = "Authentication required") => new AppError(401, "UNAUTHORIZED", message),
  forbidden: (message = "Forbidden") => new AppError(403, "FORBIDDEN", message),
  notFound: (message = "Not found") => new AppError(404, "NOT_FOUND", message),
  conflict: (message: string, details?: unknown) => new AppError(409, "CONFLICT", message, details),
  validation: (details: unknown) => new AppError(400, "VALIDATION_ERROR", "Request validation failed", details),
  providerTimeout: (provider: string) => new AppError(504, "PROVIDER_TIMEOUT", `${provider} timed out`),
  malformedProviderOutput: (provider: string) =>
    new AppError(502, "PROVIDER_MALFORMED_OUTPUT", `${provider} returned malformed output`),
  internal: () => new AppError(500, "INTERNAL_ERROR", "Unexpected server error")
};
