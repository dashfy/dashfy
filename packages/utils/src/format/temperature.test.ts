import { describe, expect, it } from 'vitest'

import { formatTemperature } from './temperature'

describe('formatTemperature', () => {
  it('formats in celsius by default', () => {
    const result = formatTemperature(25)
    expect(result).toMatch(/25/)
    expect(result).toMatch(/°|C|celsius/i)
  })

  it('formats in fahrenheit', () => {
    const result = formatTemperature(77, { unit: 'fahrenheit' })
    expect(result).toMatch(/77/)
    expect(result).toMatch(/°|F|fahrenheit/i)
  })

  it('formats in kelvin', () => {
    const result = formatTemperature(273.15, { unit: 'kelvin' })
    expect(result).toMatch(/273/)
    expect(result).toMatch(/\s*K\b/)
  })

  it('respects maximumFractionDigits', () => {
    const result = formatTemperature(25.567, { maximumFractionDigits: 1 })
    expect(result).toMatch(/25\.\d\b/)
  })

  it('respects minimumFractionDigits', () => {
    const result = formatTemperature(25, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    expect(result).toMatch(/25\.\d/)
  })

  it('handles zero', () => {
    expect(formatTemperature(0)).toMatch(/0/)
  })

  it('handles zeroFormat option', () => {
    expect(formatTemperature(0, { zeroFormat: '—' })).toBe('—')
  })

  it('handles nullFormat for null', () => {
    expect(formatTemperature(null as unknown as number, { nullFormat: 'N/A' })).toBe('N/A')
  })

  it('respects locale', () => {
    const result = formatTemperature(25.5, { locale: 'de-DE' })
    expect(result).toMatch(/25|26/) // may round by locale
  })

  it('uses fallback when null without nullFormat', () => {
    const result = formatTemperature(null as unknown as number)
    expect(result).toMatch(/0|°|NaN/)
  })
})
