import type { Logger } from '@dashfy/types'
import { getErrorMessage } from '@dashfy/utils'

import { DEFAULT_PUSH_INTERVAL } from './constants'

/**
 * Creates a push interval factory bound to a logger and prefix.
 * Used internally by the Bus when registering APIs.
 *
 * @param logger - Logger instance (from Bus, scoped per API)
 * @param prefix - Prefix for log messages (e.g. API id produces '[apiId.key]')
 * @returns CreatePushInterval function for extensions to use with only interval config
 *
 * @example
 * ```ts
 * const createPushInterval = createPushIntervalFactory(logger, 'api')
 *
 * // With explicit interval
 * const startPushInterval = createPushInterval({ interval: 1_000 })
 *
 * // With default interval (2 seconds)
 * const startPushInterval = createPushInterval()
 *
 * const stopPushInterval = startPushInterval('key', (data) => console.log(data), () => fetchData())
 *
 * // Later, stop pushing for this key
 * stopPushInterval()
 * ```
 */
export function createPushIntervalFactory(
  logger: Logger,
  prefix: string,
): (options?: {
  interval?: number
}) => (
  key: string,
  callback: (data: unknown) => void,
  fetchFn: () => Promise<unknown>,
) => () => void {
  return (options = {}) => {
    const { interval = DEFAULT_PUSH_INTERVAL } = options
    const intervals = new Map<string, NodeJS.Timeout>()
    const logKey = (key: string) => (prefix ? `${prefix}.${key}` : key)

    return (
      key: string,
      callback: (data: unknown) => void,
      fetchFn: () => Promise<unknown>,
    ): (() => void) => {
      const stop = (): void => {
        const existing = intervals.get(key)

        if (!existing) {
          return
        }

        clearInterval(existing)
        intervals.delete(key)
        logger.info(`[${logKey(key)}] Stopped push interval`)
      }

      // If a push is already running for this key, return a disposer that stops it.
      // This keeps the call idempotent without starting a duplicate interval.
      if (intervals.has(key)) {
        return stop
      }

      const pushData = async () => {
        try {
          const data = await fetchFn()
          callback(data)
        } catch (error) {
          logger.error(`[${logKey(key)}] Error: ${getErrorMessage(error)}`)
        }
      }

      void pushData()

      const timer = setInterval(() => {
        void pushData()
      }, interval)

      intervals.set(key, timer)
      logger.info(`[${logKey(key)}] Started push interval (${interval}ms)`)

      return stop
    }
  }
}
