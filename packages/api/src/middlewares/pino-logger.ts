/**
 * @fileoverview Pino logger middleware configuration for Hono
 * This file configures a logging middleware using Pino with environment-specific settings.
 *
 * @module middlewares/pino-logger
 */

import { pinoLogger as logger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";

import env from "../env";

/**
 * Creates a configured Pino logger middleware instance
 * @returns {import('hono-pino').PinoMiddleware} Configured Pino middleware for Hono
 *
 * @description
 * Configures Pino logger with:
 * - Log level from environment variable LOG_LEVEL (defaults to "info")
 * - Pretty printing in development mode
 * - Standard JSON output in production
 *
 * @example
 * ```typescript
 * const app = new Hono();
 * app.use(pinoLogger());
 * // Logs will now include:
 * // - Timestamp
 * // - Request method and path
 * // - Response status and duration
 * ```
 */
export function pinoLogger() {
  return logger({
    pino: pino(
      {
        level: env.LOG_LEVEL || "info",
      },
      env.NODE_ENV === "production" ? undefined : pretty(),
    ),
  });
}
