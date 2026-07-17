import { describe, expect, it } from 'vitest'

import { formatExponential } from './exponential'

describe('formatExponential', () => {
  it('formats numbers in scientific notation', () => {
    const result = formatExponential(1234.56)
    expect(result).toMatch(/[eE][+-]?\d+|[eE]\d+/)
    expect(result).toMatch(/1\.\d+/)
  })

  it('formats small numbers with negative exponent', () => {
    const result = formatExponential(0.00123)
    expect(result).toMatch(/e-|E-/)
  })

  it('respects maximumFractionDigits', () => {
    const result = formatExponential(1234.5678, { maximumFractionDigits: 1 })
    expect(result).toMatch(/1\.\d[eE]/)
  })

  it('respects minimumFractionDigits', () => {
    const result = formatExponential(1000, { minimumFractionDigits: 2 })
    expect(result).toMatch(/1\.\d{2}[eE]/)
  })

  it('handles zero', () => {
    const result = formatExponential(0)
    expect(result).toMatch(/0/)
  })

  it('handles zeroFormat option', () => {
    expect(formatExponential(0, { zeroFormat: '—' })).toBe('—')
  })

  it('handles nullFormat for null', () => {
    expect(formatExponential(null as unknown as number, { nullFormat: 'N/A' })).toBe('N/A')
  })

  it('respects locale', () => {
    const result = formatExponential(1000, { locale: 'de-DE' })
    expect(result).toMatch(/[eE]\d+/)
  })

  it('uses fallback when null without nullFormat', () => {
    const result = formatExponential(null as unknown as number)
    expect(result).toMatch(/0|[eE]/)
  })
})
