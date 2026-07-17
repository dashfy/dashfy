import type { Logger } from 'pino'
import pino from 'pino'

/**
 * Creates a Pino logger instance with environment-aware configuration.
 *
 * Development: pretty-printed output via `pino-pretty` (default level: `info`)
 * Production: structured JSON logs (default level: `warn`)
 *
 * @param options - Optional Pino configuration to override defaults
 * @returns Configured Pino Logger instance
 *
 * @example
 * ```ts
 * const logger = createLogger()
 * logger.info('Server started')
 * logger.error({ err }, 'Request failed')
 *
 * // Custom level
 * const debugLogger = createLogger({ level: 'debug' })
 *
 * // Child logger with context
 * const busLogger = logger.child({ component: 'bus' })
 * ```
 */
export function createLogger(options?: pino.LoggerOptions): Logger {
  const isDevelopment = process.env.NODE_ENV !== 'production'

  return pino({
    level: process.env.LOG_LEVEL ?? (isDevelopment ? 'info' : 'warn'),
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        }
      : undefined,
    ...options,
  })
}
