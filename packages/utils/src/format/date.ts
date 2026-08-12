import { format as dateFnsFormat, formatDistanceToNow } from 'date-fns'

import type { DateFormatOptions } from './types'

/**
 * Normalize a `Date`, ISO string, or Unix timestamp (seconds) into a `Date` instance.
 *
 * Numbers are treated as Unix seconds, not milliseconds, matching the rest of the
 * `@getdashfy/utils` date and timezone helpers.
 *
 * @param value - Date instance, ISO string, or Unix seconds
 * @returns The equivalent `Date` instance
 *
 * @example
 * ```ts
 * parseDateInput(new Date('2025-03-13'))  // same Date instance
 * parseDateInput('2025-03-13T18:00:00Z')  // Date parsed from the ISO string
 * parseDateInput(1710352800)              // Date from Unix seconds
 * ```
 */
export function parseDateInput(value: Date | string | number): Date {
  return value instanceof Date
    ? value
    : typeof value === 'number'
      ? new Date(value * 1000)
      : new Date(value)
}

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
  const pattern = options?.format ?? 'MMM d, yyyy'
  return dateFnsFormat(parseDateInput(value), pattern)
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
  return formatDistanceToNow(parseDateInput(value), { addSuffix: options?.addSuffix ?? true })
}
