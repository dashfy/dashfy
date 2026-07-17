import { describe, expect, it } from 'vitest'

import { formatNumber } from './number'

describe('formatNumber', () => {
  it('formats integers with thousands separators', () => {
    expect(formatNumber(1000)).toMatch(/\d{1,3}[,\s]\d{3}/)
    expect(formatNumber(1234567)).toMatch(/\d[\d,\s]+/)
  })

  it('formats decimals with default precision', () => {
    const result = formatNumber(3.14159)
    expect(result).toMatch(/3\.\d{2}/)
  })

  it('respects minimumFractionDigits', () => {
    expect(formatNumber(42, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).toMatch(
      /42\.\d{2}/,
    )
  })

  it('respects maximumFractionDigits', () => {
    expect(formatNumber(3.14159, { maximumFractionDigits: 2 })).toMatch(/3\.14/)
  })

  it('formats with compact notation', () => {
    const result = formatNumber(1500, { notation: 'compact', compactDisplay: 'short' })
    expect(result).toMatch(/[Kk]/)
    expect(result).toMatch(/\d/)
  })

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('handles zeroFormat option', () => {
    expect(formatNumber(0, { zeroFormat: 'N/A' })).toBe('N/A')
  })

  it('handles nullFormat for null', () => {
    expect(formatNumber(null as unknown as number, { nullFormat: '—' })).toBe('—')
  })

  it('uses fallback when null without nullFormat', () => {
    const result = formatNumber(null as unknown as number)
    expect(result).toMatch(/0|NaN/)
  })

  it('respects locale', () => {
    const en = formatNumber(1234.56, { locale: 'en-US' })
    const de = formatNumber(1234.56, { locale: 'de-DE' })
    expect(en).toContain('.')
    expect(de).toContain(',')
  })

  it('uses default locale when options.locale not passed', async () => {
    const { setDefaultLocale } = await import('./core')
    setDefaultLocale('de-DE')
    const result = formatNumber(1234.56)
    expect(result).toContain(',')
    setDefaultLocale(undefined)
  })
})
