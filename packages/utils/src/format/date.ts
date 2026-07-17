import { format as dateFnsFormat, formatDistanceToNow } from 'date-fns'

import type { DateFormatOptions } from './types'

/**
 * Format a date (Date, string, or Unix timestamp in seconds).
 *
 * @param value - Date instance, ISO string, or Unix seconds
 * @param options - Optional formatting options
 * @returns Formatted string per the pattern
 *
 * @example
 * ```ts
 * formatDate(new Date('2025-03-13'))                 // 'Mar 13, 2025'
 * formatDate('2025-03-13', { format: 'yyyy-MM-dd' }) // '2025-03-13'
 * ```
 */
export function formatDate(value: Date | string | number, options?: DateFormatOptions): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === 'number'
        ? new Date(value * 1000)
        : new Date(value)
  const pattern = options?.format ?? 'MMM d, yyyy'
  return dateFnsFormat(date, pattern)
}

/**
 * Format a date as human-readable relative time.
 *
 * @param value - Date instance, ISO string, or Unix seconds
 * @param options - Optional formatting options
 * @returns Relative string such as "about 2 hours ago" or "in 3 days"
 *
 * @example
 * ```ts
 * formatRelativeTime(Date.now() / 1000 - 3600)        // 'about 1 hour ago'
 * formatRelativeTime(new Date(), { addSuffix: false }) // 'less than a minute'
 * ```
 */
export function formatRelativeTime(
  value: Date | string | number,
  options?: DateFormatOptions,
): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === 'number'
        ? new Date(value * 1000)
        : new Date(value)
  return formatDistanceToNow(date, { addSuffix: options?.addSuffix ?? true })
}
