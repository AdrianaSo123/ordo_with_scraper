import { Logger } from "../core/services/ErrorHandler";

export class ConsoleLogger implements Logger {
  info(message: string, context?: Record<string, any>): void {
    console.info(`[INFO] ${message}`, context || "");
  }

  warn(message: string, context?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, context || "");
  }

  error(message: string, context?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, context || "");
  }

  debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, context || "");
    }
  }
}
