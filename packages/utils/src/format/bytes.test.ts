import { describe, expect, it } from 'vitest'

import { formatBytes, formatBytesPerSecond } from './bytes'
import { setDefaultLocale } from './core'

describe('formatBytes', () => {
  it('formats bytes with decimal units by default', () => {
    expect(formatBytes(1024)).toMatch(/[Kk][Bb]/)
    expect(formatBytes(1000)).toMatch(/[Kk][Bb]/)
  })

  it('formats with binary units when binary: true', () => {
    const result = formatBytes(1024, { binary: true })
    expect(result).toMatch(/[Kk]i[Bb]/)
  })

  it('formats large values', () => {
    expect(formatBytes(1_073_741_824)).toMatch(/[Gg][Bb]/)
    expect(formatBytes(1_000_000_000)).toMatch(/[Gg][Bb]/)
  })

  it('handles bigint', () => {
    const result = formatBytes(BigInt(2048))
    expect(result).toMatch(/2[.,]?\d*\s*[Kk][Bb]/)
  })

  it('handles zero', () => {
    expect(formatBytes(0)).toMatch(/0\s*[Bb]/)
  })

  it('handles zeroFormat option', () => {
    expect(formatBytes(0, { zeroFormat: 'Empty' })).toBe('Empty')
  })

  it('handles nullFormat for null', () => {
    expect(formatBytes(null as unknown as number, { nullFormat: '—' })).toBe('—')
  })

  it('respects minimumFractionDigits', () => {
    const result = formatBytes(1500, { minimumFractionDigits: 2, locale: 'en-US' })
    expect(result).toMatch(/[.,]\d{2}/)
  })

  it('respects maximumFractionDigits', () => {
    const result = formatBytes(1234, { maximumFractionDigits: 0 })
    expect(result).not.toMatch(/\.\d/)
  })

  it('uses fallback when null without nullFormat', () => {
    const result = formatBytes(null as unknown as number)
    expect(result).toMatch(/0\s*[Bb]/)
  })

  it('uses array locale when locale is array', () => {
    const result = formatBytes(1024, { locale: ['de-DE', 'en-US'] })
    expect(result).toMatch(/[Kk][Bb]/)
  })

  it('uses string locale when locale is string', () => {
    const result = formatBytes(1024, { locale: 'de-DE' })
    expect(result).toMatch(/[Kk][Bb]/)
  })

  it('passes locale: false when resolveLocale returns undefined', () => {
    setDefaultLocale(undefined)
    const result = formatBytes(1024)
    expect(result).toMatch(/[Kk][Bb]/)
    setDefaultLocale('en-US')
  })
})

describe('formatBytesPerSecond', () => {
  it('formats bytes per second with decimal units by default', () => {
    expect(formatBytesPerSecond(1024)).toMatch(/[Kk][Bb]\/s/)
    expect(formatBytesPerSecond(1000)).toMatch(/[Kk][Bb]\/s/)
  })

  it('formats with binary units when binary: true', () => {
    expect(formatBytesPerSecond(1024, { binary: true })).toMatch(/[Kk]i[Bb]\/s/)
  })

  it('formats large values', () => {
    expect(formatBytesPerSecond(1_073_741_824)).toMatch(/[Gg][Bb]\/s/)
  })

  it('handles bigint', () => {
    expect(formatBytesPerSecond(BigInt(2048))).toMatch(/2[.,]?\d*\s*[Kk][Bb]\/s/)
  })

  it('handles zero', () => {
    expect(formatBytesPerSecond(0)).toMatch(/0\s*[Bb]\/s/)
  })

  it('handles zeroFormat option', () => {
    expect(formatBytesPerSecond(0, { zeroFormat: 'Idle' })).toBe('Idle')
  })

  it('handles nullFormat for null', () => {
    expect(formatBytesPerSecond(null as unknown as number, { nullFormat: '—' })).toBe('—')
  })

  it('respects maximumFractionDigits', () => {
    const result = formatBytesPerSecond(1234, { maximumFractionDigits: 0 })
    expect(result).not.toMatch(/\.\d/)
    expect(result).toMatch(/\/s$/)
  })

  it('uses fallback when null without nullFormat', () => {
    expect(formatBytesPerSecond(null as unknown as number)).toMatch(/0\s*[Bb]\/s/)
  })

  it('respects locale', () => {
    setDefaultLocale(undefined)
    expect(formatBytesPerSecond(1024, { locale: 'de-DE' })).toMatch(/[Kk][Bb]\/s/)
    setDefaultLocale('en-US')
  })
})
