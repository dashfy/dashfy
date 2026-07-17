import { describe, expect, it } from 'vitest'

import { formatPercent } from './percent'

describe('formatPercent', () => {
  it('scales 0.5 to 50% by default', () => {
    expect(formatPercent(0.5)).toMatch(/50\s*%/)
  })

  it('scales 1 to 100%', () => {
    expect(formatPercent(1)).toMatch(/100\s*%/)
  })

  it('respects scaleBy100: false', () => {
    const result = formatPercent(50, { scaleBy100: false })
    expect(result).toMatch(/50\s*%/)
  })

  it('respects maximumFractionDigits', () => {
    const result = formatPercent(0.1234, { maximumFractionDigits: 2 })
    expect(result).toMatch(/\d+\.\d{2}\s*%/)
  })

  it('respects minimumFractionDigits', () => {
    const result = formatPercent(0.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    expect(result).toMatch(/50\.\d{2}\s*%/)
  })

  it('handles zero', () => {
    expect(formatPercent(0)).toMatch(/0\s*%/)
  })

  it('handles zeroFormat option', () => {
    expect(formatPercent(0, { zeroFormat: '—' })).toBe('—')
  })

  it('handles nullFormat for null', () => {
    expect(formatPercent(null as unknown as number, { nullFormat: 'N/A' })).toBe('N/A')
  })

  it('uses fallback when null without nullFormat', () => {
    const result = formatPercent(null as unknown as number)
    expect(result).toMatch(/0|%|NaN/)
  })

  it('respects locale', () => {
    const result = formatPercent(0.5, { locale: 'de-DE' })
    expect(result).toMatch(/%/)
  })
})
