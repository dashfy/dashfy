import { describe, expect, it } from 'vitest'

import { formatDate, formatRelativeTime } from './date'

describe('formatDate', () => {
  it('formats Date object with default pattern', () => {
    const date = new Date('2024-03-15T12:00:00Z')
    const result = formatDate(date)
    expect(result).toMatch(/Mar|March/)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2024/)
  })

  it('formats Unix timestamp (seconds)', () => {
    const timestamp = Math.floor(new Date('2024-01-01T12:00:00Z').getTime() / 1000)
    const result = formatDate(timestamp)
    expect(result).toMatch(/Jan|January/)
    expect(result).toMatch(/2024/)
  })

  it('formats ISO date string', () => {
    const result = formatDate('2024-06-15')
    expect(result).toMatch(/Jun|June/)
    expect(result).toMatch(/14|15/) // may vary by timezone
  })

  it('respects custom format option', () => {
    const date = new Date('2024-03-15T12:00:00Z')
    expect(formatDate(date, { format: 'yyyy-MM-dd' })).toBe('2024-03-15')
    expect(formatDate(date, { format: 'MMM d' })).toMatch(/Mar.*15/)
  })
})

describe('formatRelativeTime', () => {
  it('formats with addSuffix by default', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000)
    const result = formatRelativeTime(past)
    expect(result).toMatch(/ago|hour/i)
  })

  it('respects addSuffix: false', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000)
    const result = formatRelativeTime(past, { addSuffix: false })
    expect(result).not.toMatch(/ago|in/)
  })

  it('formats Unix timestamp', () => {
    const past = Math.floor((Date.now() - 86400 * 1000) / 1000)
    const result = formatRelativeTime(past)
    expect(result).toMatch(/ago|day/i)
  })

  it('formats date string', () => {
    const past = new Date(Date.now() - 120 * 1000).toISOString()
    const result = formatRelativeTime(past)
    expect(result).toMatch(/ago|minute/i)
  })
})
