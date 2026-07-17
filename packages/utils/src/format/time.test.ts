import { describe, expect, it } from 'vitest'

import { formatTime, formatTimeCompact } from './time'

describe('formatTime', () => {
  it('formats seconds as HH:MM:SS in short style', () => {
    expect(formatTime(3661, { style: 'short' })).toBe('01:01:01')
    expect(formatTime(65, { style: 'short' })).toBe('00:01:05')
    expect(formatTime(0, { style: 'short' })).toBe('00:00:00')
  })

  it('formats with long style (human-readable)', () => {
    const result = formatTime(3661, { style: 'long' })
    expect(result).toMatch(/hour|minute|second/)
  })

  it('formats 1 hour 30 minutes in long style', () => {
    const result = formatTime(5400, { style: 'long' })
    expect(result).toMatch(/1|90|minute|hour/)
  })

  it('excludes seconds when includeSeconds: false', () => {
    const result = formatTime(3661, { style: 'long', includeSeconds: false })
    expect(result).not.toMatch(/second/)
  })

  it('handles zero', () => {
    expect(formatTime(0)).toMatch(/0|second/)
  })

  it('handles zeroFormat option', () => {
    expect(formatTime(0, { zeroFormat: '—' })).toBe('—')
  })

  it('handles nullFormat for null', () => {
    expect(formatTime(null as unknown as number, { nullFormat: 'N/A' })).toBe('N/A')
  })

  it('pads single digits with zero in short style', () => {
    expect(formatTime(5, { style: 'short' })).toBe('00:00:05')
    expect(formatTime(125, { style: 'short' })).toBe('00:02:05')
  })

  it('does not pad when value >= 10 in short style', () => {
    expect(formatTime(36611, { style: 'short' })).toBe('10:10:11')
  })

  it('uses fallback when null without nullFormat', () => {
    const result = formatTime(null as unknown as number)
    expect(result).toBe('0:00:00')
  })
})

describe('formatTimeCompact', () => {
  it('formats days, hours, and minutes', () => {
    const seconds = 3 * 86400 + 5 * 3600 + 12 * 60
    expect(formatTimeCompact(seconds)).toBe('3d 5h 12m')
  })

  it('omits zero units', () => {
    expect(formatTimeCompact(2 * 3600)).toBe('2h')
    expect(formatTimeCompact(45 * 60)).toBe('45m')
    expect(formatTimeCompact(86400 + 30 * 60)).toBe('1d 30m')
  })

  it('returns 0m for zero seconds', () => {
    expect(formatTimeCompact(0)).toBe('0m')
  })

  it('rounds sub-minute values down to 0m', () => {
    expect(formatTimeCompact(45)).toBe('0m')
  })

  it('honors zeroFormat option', () => {
    expect(formatTimeCompact(0, { zeroFormat: '—' })).toBe('—')
  })

  it('honors nullFormat for null', () => {
    expect(formatTimeCompact(null as unknown as number, { nullFormat: 'N/A' })).toBe('N/A')
  })

  it('falls back to 0m when null without nullFormat', () => {
    expect(formatTimeCompact(null as unknown as number)).toBe('0m')
  })
})
