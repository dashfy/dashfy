import { describe, expect, it } from 'vitest'

import {
  formatDateInTimeZone,
  formatTimeZoneLabel,
  getTimeZoneParts,
  isDaytime,
  parseTimeOfDay,
} from './timezone'

describe('formatDateInTimeZone', () => {
  it('falls back to local formatting without a timezone', () => {
    const date = new Date('2025-01-15T18:00:00Z')
    expect(formatDateInTimeZone(date)).toBe(formatDateInTimeZone(date, {}))
  })

  it('formats in the given timezone using the default pattern', () => {
    const result = formatDateInTimeZone(new Date('2025-01-15T18:00:00Z'), {
      timeZone: 'America/New_York',
    })
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2025/)
  })

  it('formats with a custom pattern in a timezone (EST, UTC-5 in January)', () => {
    const result = formatDateInTimeZone(new Date('2025-01-15T18:00:00Z'), {
      timeZone: 'America/New_York',
      format: 'yyyy-MM-dd HH:mm',
    })
    expect(result).toBe('2025-01-15 13:00')
  })

  it('formats with a custom pattern in a timezone with no offset in winter (GMT)', () => {
    const result = formatDateInTimeZone(new Date('2025-01-15T18:00:00Z'), {
      timeZone: 'Europe/London',
      format: 'yyyy-MM-dd HH:mm',
    })
    expect(result).toBe('2025-01-15 18:00')
  })

  it('rolls the date over when the timezone is ahead of UTC', () => {
    const result = formatDateInTimeZone(new Date('2025-01-15T20:00:00Z'), {
      timeZone: 'Asia/Tokyo',
      format: 'yyyy-MM-dd HH:mm',
    })
    expect(result).toBe('2025-01-16 05:00')
  })

  it('accepts Unix timestamps (seconds) and ISO strings', () => {
    const timestamp = Math.floor(new Date('2025-01-15T18:00:00Z').getTime() / 1000)
    expect(formatDateInTimeZone(timestamp, { timeZone: 'America/New_York', format: 'HH:mm' })).toBe(
      '13:00',
    )
    expect(
      formatDateInTimeZone('2025-01-15T18:00:00Z', {
        timeZone: 'America/New_York',
        format: 'HH:mm',
      }),
    ).toBe('13:00')
  })
})

describe('getTimeZoneParts', () => {
  it('returns parts in local time when no timezone is given', () => {
    const date = new Date('2025-01-15T18:00:00Z')
    const parts = getTimeZoneParts(date)
    expect(parts.hours).toBe(date.getHours())
    expect(parts.minutes).toBe(date.getMinutes())
    expect(parts.year).toBe(date.getFullYear())
  })

  it('returns parts computed in the given timezone', () => {
    const parts = getTimeZoneParts(new Date('2025-01-15T18:00:00Z'), 'America/New_York')
    expect(parts).toEqual({
      year: 2025,
      month: 1,
      day: 15,
      hours: 13,
      minutes: 0,
      seconds: 0,
      weekday: 3, // Wednesday
    })
  })
})

describe('formatTimeZoneLabel', () => {
  it('strips the region prefix and replaces underscores with spaces', () => {
    expect(formatTimeZoneLabel('America/Los_Angeles')).toBe('Los Angeles')
    expect(formatTimeZoneLabel('Europe/London')).toBe('London')
  })

  it('uses the last segment for multi-level timezone names', () => {
    expect(formatTimeZoneLabel('America/Argentina/Buenos_Aires')).toBe('Buenos Aires')
  })
})

describe('parseTimeOfDay', () => {
  it('parses HH:mm strings', () => {
    expect(parseTimeOfDay('06:00')).toEqual({ hours: 6, minutes: 0 })
    expect(parseTimeOfDay('18:30')).toEqual({ hours: 18, minutes: 30 })
  })

  it('parses single-digit hours and minutes', () => {
    expect(parseTimeOfDay('6:0')).toEqual({ hours: 6, minutes: 0 })
  })

  it('throws on malformed input', () => {
    expect(() => parseTimeOfDay('not-a-time')).toThrow(/Invalid time of day/)
  })

  it('throws on out-of-range values', () => {
    expect(() => parseTimeOfDay('24:00')).toThrow(/Invalid time of day/)
    expect(() => parseTimeOfDay('12:60')).toThrow(/Invalid time of day/)
  })
})

describe('isDaytime', () => {
  const timeZone = 'America/Los_Angeles'

  it('returns true at midday', () => {
    // 2025-01-15T20:00:00Z is 12:00 PST (UTC-8 in January)
    expect(isDaytime(new Date('2025-01-15T20:00:00Z'), '06:00', '18:00', timeZone)).toBe(true)
  })

  it('returns false at night', () => {
    // 2025-01-16T06:00:00Z is 22:00 PST the previous day
    expect(isDaytime(new Date('2025-01-16T06:00:00Z'), '06:00', '18:00', timeZone)).toBe(false)
  })

  it('is inclusive of sunrise and exclusive of sunset', () => {
    // 2025-01-15T14:00:00Z is exactly 06:00 PST
    expect(isDaytime(new Date('2025-01-15T14:00:00Z'), '06:00', '18:00', timeZone)).toBe(true)
    // 2025-01-16T02:00:00Z is exactly 18:00 PST
    expect(isDaytime(new Date('2025-01-16T02:00:00Z'), '06:00', '18:00', timeZone)).toBe(false)
  })
})
