import { describe, expect, it } from 'vitest'

import { formatCurrency } from './currency'

describe('formatCurrency', () => {
  it('formats as USD by default', () => {
    const result = formatCurrency(1234.56)
    expect(result).toMatch(/\$|USD/)
    expect(result).toMatch(/1[,\s]?234/)
  })

  it('formats with EUR currency', () => {
    const result = formatCurrency(99.99, { currency: 'EUR' })
    expect(result).toMatch(/€|EUR|99/)
  })

  it('formats with GBP currency', () => {
    const result = formatCurrency(50, { currency: 'GBP' })
    expect(result).toMatch(/£|GBP|50/)
  })

  it('respects maximumFractionDigits', () => {
    const result = formatCurrency(10.5, { maximumFractionDigits: 0 })
    expect(result).not.toMatch(/\.\d/)
  })

  it('respects minimumFractionDigits', () => {
    const result = formatCurrency(10, { minimumFractionDigits: 2 })
    expect(result).toMatch(/\.\d{2}/)
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toMatch(/0/)
  })

  it('handles zeroFormat option', () => {
    expect(formatCurrency(0, { zeroFormat: 'Free' })).toBe('Free')
  })

  it('handles nullFormat for null', () => {
    expect(formatCurrency(null as unknown as number, { nullFormat: '—' })).toBe('—')
  })

  it('respects locale', () => {
    const result = formatCurrency(1234.56, { locale: 'pt-BR', currency: 'BRL' })
    expect(result).toMatch(/1\.?234|1\s234/)
  })

  it('uses fallback when null without nullFormat', () => {
    const result = formatCurrency(null as unknown as number)
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })

  it('uses fallback with currency option when null', () => {
    const result = formatCurrency(null as unknown as number, { currency: 'EUR' })
    expect(result).toMatch(/€|EUR/)
  })
})
