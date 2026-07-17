import { formatDuration, intervalToDuration } from 'date-fns'

import { handleZeroNull } from './core'
import type { TimeFormatOptions } from './types'

/**
 * Format a duration in seconds to HH:MM:SS or human-readable string.
 *
 * @param seconds - The duration in seconds to format
 * @param options - Optional formatting options
 * @returns Formatted string representing the time value
 *
 * @example
 * ```ts
 * formatTime(3661, { style: 'short' })
 * // => '01:01:01'
 *
 * formatTime(65, { style: 'long' })
 * // => '1 minute 5 seconds'
 *
 * formatTime(3661, { style: 'long', includeSeconds: false })
 * // => '1 hour 1 minute'
 * ```
 */
export function formatTime(seconds: number, options?: TimeFormatOptions): string {
  const result = handleZeroNull(seconds, options, (secondsToFormat) => {
    if (options?.style === 'long' || options?.style === undefined) {
      const duration = intervalToDuration({ start: 0, end: secondsToFormat * 1000 })
      const formatted = formatDuration(duration, {
        format:
          options?.includeSeconds !== false
            ? ['hours', 'minutes', 'seconds']
            : ['hours', 'minutes'],
      })

      return formatted || '0 seconds'
    }

    const h = Math.floor(secondsToFormat / 3600)
    const m = Math.floor((secondsToFormat - h * 3600) / 60)
    const sec = Math.round(secondsToFormat - h * 3600 - m * 60)
    const pad = (value: number) => (value < 10 ? `0${value}` : String(value))

    return `${pad(h)}:${pad(m)}:${pad(sec)}`
  })

  return result ?? '0:00:00'
}

/**
 * Format a duration in seconds into a compact, multi-day-aware string.
 *
 * Drops zero units and joins the remainder with spaces. Useful for uptime
 * fields where space is tight and the long-form `formatTime` is too verbose.
 *
 * @param seconds - The duration in seconds to format
 * @param options - Optional formatting options
 * @returns Formatted string representing the duration
 *
 * @example
 * ```ts
 * formatTimeCompact(3 * 86400 + 5 * 3600 + 12 * 60)
 * // => '3d 5h 12m'
 *
 * formatTimeCompact(45 * 60)
 * // => '45m'
 *
 * formatTimeCompact(0)
 * // => '0m'
 * ```
 */
export function formatTimeCompact(seconds: number, options?: TimeFormatOptions): string {
  const result = handleZeroNull(seconds, options, (secondsToFormat) => {
    const days = Math.floor(secondsToFormat / 86400)
    const hours = Math.floor((secondsToFormat % 86400) / 3600)
    const minutes = Math.floor((secondsToFormat % 3600) / 60)

    const parts: string[] = []

    if (days > 0) {
      parts.push(`${days}d`)
    }

    if (hours > 0) {
      parts.push(`${hours}h`)
    }

    if (minutes > 0) {
      parts.push(`${minutes}m`)
    }

    return parts.length > 0 ? parts.join(' ') : '0m'
  })

  return result ?? '0m'
}
