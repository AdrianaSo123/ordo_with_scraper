export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface AppError extends Error {
  code: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
}

export interface Logger {
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
}

export class ErrorHandler {
  constructor(private logger: Logger) {}

  handle(error: unknown, context?: Record<string, any>): void {
    if (this.isAppError(error)) {
      this.logger.error(`[${error.code}] ${error.message}`, {
        ...context,
        severity: error.severity,
        stack: error.stack,
      });
    } else if (error instanceof Error) {
      this.logger.error(error.message, { ...context, stack: error.stack });
    } else {
      this.logger.error("An unknown error occurred", { ...context, error });
    }
  }

  private isAppError(error: any): error is AppError {
    return error && typeof error.code === "string" && typeof error.severity === "string";
  }
}
