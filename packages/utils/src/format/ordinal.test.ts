import { describe, expect, it } from 'vitest'

import { formatOrdinal } from './ordinal'

describe('formatOrdinal', () => {
  it('formats 1 as 1st', () => {
    expect(formatOrdinal(1)).toMatch(/1st/)
  })

  it('formats 2 as 2nd', () => {
    expect(formatOrdinal(2)).toMatch(/2nd/)
  })

  it('formats 3 as 3rd', () => {
    expect(formatOrdinal(3)).toMatch(/3rd/)
  })

  it('formats 4 as 4th', () => {
    expect(formatOrdinal(4)).toMatch(/4th/)
  })

  it('formats 11 as 11th', () => {
    expect(formatOrdinal(11)).toMatch(/11th/)
  })

  it('formats 21 as 21st', () => {
    expect(formatOrdinal(21)).toMatch(/21st/)
  })

  it('rounds decimals', () => {
    expect(formatOrdinal(2.7)).toMatch(/3rd/)
  })

  it('handles zero', () => {
    expect(formatOrdinal(0)).toMatch(/0th/)
  })

  it('handles zeroFormat option', () => {
    expect(formatOrdinal(0, { zeroFormat: '—' })).toBe('—')
  })

  it('handles nullFormat for null', () => {
    expect(formatOrdinal(null as unknown as number, { nullFormat: 'N/A' })).toBe('N/A')
  })

  it('uses fallback when null without nullFormat', () => {
    const result = formatOrdinal(null as unknown as number)
    expect(result).toMatch(/th/)
  })

  it('respects locale', () => {
    const result = formatOrdinal(1, { locale: 'en-US' })
    expect(result).toMatch(/1st/)
  })

  it('uses "th" fallback for plural forms not in map (e.g. many)', () => {
    const result = formatOrdinal(11, { locale: 'ar' })
    expect(result).toMatch(/\d+[a-z]+/)
  })

  it('falls back to "other" when Intl.PluralRules is undefined', () => {
    const original = Intl.PluralRules
    Object.defineProperty(Intl, 'PluralRules', {
      value: undefined,
      configurable: true,
      writable: true,
    })
    try {
      // With fallback, all use "th" suffix
      expect(formatOrdinal(1)).toMatch(/1th/)
      expect(formatOrdinal(2)).toMatch(/2th/)
      expect(formatOrdinal(4)).toMatch(/4th/)
    } finally {
      Object.defineProperty(Intl, 'PluralRules', {
        value: original,
        configurable: true,
        writable: true,
      })
    }
  })
})
