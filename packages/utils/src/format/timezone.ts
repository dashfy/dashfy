import { TZDate } from '@date-fns/tz'
import { format as dateFnsFormat } from 'date-fns'

import { formatDate, parseDateInput } from './date'
import type { TimeZoneFormatOptions, TimeZoneParts } from './types'

/**
 * Format a date (Date, string, or Unix timestamp in seconds) in a given IANA timezone.
 *
 * Falls back to `formatDate` (local time) when `options.timeZone` is not set.
 *
 * @param value - Date instance, ISO string, or Unix seconds
 * @param options - Optional formatting options, including `timeZone`
 * @returns Formatted string per the pattern, computed in the given timezone
 *
 * @example
 * ```ts
 * formatDateInTimeZone(new Date('2025-03-13T18:00:00Z'), { timeZone: 'America/Los_Angeles' })
 * // => 'Mar 13, 2025'
 *
 * formatDateInTimeZone(new Date('2025-03-13T18:00:00Z'), {
 *   timeZone: 'America/Los_Angeles',
 *   format: 'hh:mm',
 * })
 * // => '11:00'
 * ```
 */
export function formatDateInTimeZone(
  value: Date | string | number,
  options?: TimeZoneFormatOptions,
): string {
  if (!options?.timeZone) {
    return formatDate(value, options)
  }

  const pattern = options.format ?? 'MMM d, yyyy'
  return dateFnsFormat(new TZDate(parseDateInput(value), options.timeZone), pattern)
}

/**
 * Get the individual date/time components of a value as observed in a given timezone.
 *
 * @param value - Date instance, ISO string, or Unix seconds
 * @param timeZone - IANA timezone name (e.g. `America/Los_Angeles`). Defaults to local time.
 * @returns The year, month (1-12), day, hours (0-23), minutes, seconds, and weekday (0=Sunday)
 *
 * @example
 * ```ts
 * getTimeZoneParts(new Date('2025-03-13T18:00:00Z'), 'America/Los_Angeles')
 * // => { year: 2025, month: 3, day: 13, hours: 11, minutes: 0, seconds: 0, weekday: 4 }
 * ```
 */
export function getTimeZoneParts(value: Date | string | number, timeZone?: string): TimeZoneParts {
  const date = parseDateInput(value)
  const zoned = timeZone ? new TZDate(date, timeZone) : date

  return {
    year: zoned.getFullYear(),
    month: zoned.getMonth() + 1,
    day: zoned.getDate(),
    hours: zoned.getHours(),
    minutes: zoned.getMinutes(),
    seconds: zoned.getSeconds(),
    weekday: zoned.getDay(),
  }
}

/**
 * Turn an IANA timezone name into a short, human-readable label.
 *
 * @param timeZone - IANA timezone name (e.g. `America/Los_Angeles`)
 * @returns The last segment of the name, with underscores replaced by spaces
 *
 * @example
 * ```ts
 * formatTimeZoneLabel('America/Los_Angeles') // 'Los Angeles'
 * formatTimeZoneLabel('Europe/London')       // 'London'
 * ```
 */
export function formatTimeZoneLabel(timeZone: string): string {
  const city = timeZone.split('/').pop() ?? timeZone
  return city.replace(/_/g, ' ')
}

/**
 * Parse a time-of-day string into hours and minutes.
 *
 * @param value - Time string in `HH:mm`, `H:mm`, or `H:m` format
 * @returns The parsed hours (0-23) and minutes (0-59)
 * @throws When `value` is not a valid time-of-day string
 *
 * @example
 * ```ts
 * parseTimeOfDay('06:00') // { hours: 6, minutes: 0 }
 * parseTimeOfDay('18:30') // { hours: 18, minutes: 30 }
 * ```
 */
export function parseTimeOfDay(value: string): { hours: number; minutes: number } {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value.trim())

  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid time of day: "${value}". Expected a "HH:mm" string.`)
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time of day: "${value}". Hours must be 0-23 and minutes 0-59.`)
  }

  return { hours, minutes }
}

/**
 * Determine whether a value falls between a daily sunrise and sunset time.
 *
 * @param value - Date instance, ISO string, or Unix seconds
 * @param sunRise - Time-of-day string (e.g. `06:00`) when the sun rises
 * @param sunSet - Time-of-day string (e.g. `18:00`) when the sun sets
 * @param timeZone - IANA timezone name. Defaults to local time.
 * @returns `true` when the time-of-day component of `value` is within `[sunRise, sunSet)`
 *
 * @example
 * ```ts
 * isDaytime(new Date('2025-03-13T18:00:00Z'), '06:00', '18:00', 'America/Los_Angeles')
 * // => true (11:00 local time)
 * ```
 */
export function isDaytime(
  value: Date | string | number,
  sunRise: string,
  sunSet: string,
  timeZone?: string,
): boolean {
  const { hours, minutes } = getTimeZoneParts(value, timeZone)
  const currentMinutes = hours * 60 + minutes

  const rise = parseTimeOfDay(sunRise)
  const set = parseTimeOfDay(sunSet)
  const riseMinutes = rise.hours * 60 + rise.minutes
  const setMinutes = set.hours * 60 + set.minutes

  return currentMinutes >= riseMinutes && currentMinutes < setMinutes
}
