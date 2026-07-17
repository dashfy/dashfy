import { describe, expect, it } from 'vitest'

import { getDefaultLocale, setDefaultLocale } from './core'
import { format } from './format'

describe('format', () => {
  it('returns nullFormat for null', () => {
    expect(format(null, '0,0', { nullFormat: '—' })).toBe('—')
  })

  it('returns nullFormat for undefined', () => {
    expect(format(undefined, '0,0', { nullFormat: 'N/A' })).toBe('N/A')
  })

  it('returns empty string for null without nullFormat', () => {
    expect(format(null, '0,0')).toBe('')
  })

  it('formats ordinal', () => {
    expect(format(1, 'ordinal')).toMatch(/1st/)
    expect(format(3, '0o')).toMatch(/3rd/)
  })

  it('formats exponential', () => {
    expect(format(1234, 'exponential')).toMatch(/[eE]\d+/)
    expect(format(1234, '0.00e+0')).toMatch(/[eE]/)
    expect(format(0.001, '1e-3')).toMatch(/[eE]/)
  })

  it('formats relative date', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000)
    expect(format(past, 'relative')).toMatch(/ago|hour/i)
    expect(format(past.toISOString(), 'relative')).toMatch(/ago|hour/i)
    const pastTs = Math.floor(past.getTime() / 1000)
    expect(format(pastTs, 'relative')).toMatch(/ago|hour|minute/i)
  })

  it('formats list', () => {
    expect(format(['A', 'B', 'C'], 'list')).toMatch(/A.*B.*C/)
  })

  it('formats currency with $', () => {
    expect(format(1000, '$0,0')).toMatch(/\$|1,?000/)
  })

  it('formats currency with €', () => {
    expect(format(100, '€0,0')).toMatch(/€|100/)
  })

  it('formats currency with £', () => {
    expect(format(50, '£0,0')).toMatch(/£|50/)
  })

  it('formats currency with currency keyword', () => {
    expect(format(100, 'currency')).toMatch(/\$|100/)
  })

  it('formats percent', () => {
    expect(format(0.5, '%')).toMatch(/50\s*%/)
    expect(format(0.5, '0.00%')).toMatch(/50.*%/)
  })

  it('formats bytes', () => {
    expect(format(1024, '0b')).toMatch(/[Kk][Bb]/)
    expect(format(1024, '0ib')).toMatch(/[Kk]i[Bb]/)
    expect(format(BigInt(2048), '0b')).toMatch(/[Kk][Bb]/)
  })

  it('formats bytes per second', () => {
    expect(format(1024, '0b/s')).toMatch(/[Kk][Bb]\/s/)
    expect(format(1024, '0ib/s')).toMatch(/[Kk]i[Bb]\/s/)
    expect(format(1024, 'bps')).toMatch(/[Kk][Bb]\/s/)
    expect(format(BigInt(2048), '0b/s')).toMatch(/[Kk][Bb]\/s/)
    expect(format(0, '0b/s')).toMatch(/0\s*[Bb]\/s/)
  })

  it('formats time (seconds to HH:MM:SS)', () => {
    expect(format(3661, '0:00:00')).toBe('01:01:01')
    expect(format(65, ':')).toBe('00:01:05')
  })

  it('formats time/duration with long style', () => {
    expect(format(3661, 'time')).toMatch(/hour|minute|second/i)
    expect(format(3661, 'duration')).toMatch(/hour|minute|second/i)
  })

  it('formats uptime in compact style', () => {
    expect(format(3 * 86400 + 5 * 3600 + 12 * 60, 'uptime')).toBe('3d 5h 12m')
    expect(format(0, 'uptime')).toBe('0m')
  })

  it('formats temperature', () => {
    expect(format(25, 'celsius')).toMatch(/25|°C/)
    expect(format(77, 'fahrenheit')).toMatch(/77|°F/)
    expect(format(273, 'kelvin')).toMatch(/273.*K/)
    expect(format(25, 'temp')).toMatch(/25/)
  })

  it('formats date', () => {
    const d = new Date('2024-03-15T12:00:00Z')
    expect(format(d, 'date')).toMatch(/Mar.*15.*2024/)
    expect(format(d, 'short')).toMatch(/Mar.*15/)
    expect(format(d, 'long')).toMatch(/March.*15.*2024/)
    expect(format(d, 'iso')).toMatch(/2024-03-15/)
  })

  it('formats date from Unix timestamp', () => {
    const ts = Math.floor(new Date('2024-01-15T12:00:00Z').getTime() / 1000)
    expect(format(ts, 'date')).toMatch(/2024/)
  })

  it('formats date from string', () => {
    expect(format('2024-06-15', 'date')).toMatch(/Jun|2024/)
  })

  it('formats plain numbers', () => {
    expect(format(1000, '0,0')).toMatch(/1,?000/)
    expect(format(3.14, '0.00')).toMatch(/3\.14/)
  })

  it('formats compact notation', () => {
    expect(format(1500, '0.0a')).toMatch(/[Kk]/)
    expect(format(1500, '0 a')).toMatch(/thousand|k/i)
  })

  it('formats with decimals from format string', () => {
    expect(format(3.14159, '0.000')).toMatch(/3\.\d{3}/)
  })

  it('returns nullFormat for NaN when parsing number', () => {
    expect(format('invalid', '0,0', { nullFormat: '—' })).toBe('—')
  })

  it('returns empty string for NaN without nullFormat', () => {
    expect(format('invalid', '0,0')).toBe('')
  })

  it('formats bigint as number', () => {
    expect(format(BigInt(1000), '0,0')).toMatch(/1,?000/)
  })

  it('formats string number', () => {
    expect(format('1234.56', '0,0.00')).toMatch(/1,?234/)
  })

  it('trims and lowercases format string', () => {
    expect(format(1000, '  0,0  ')).toMatch(/1,?000/)
    expect(format(0.5, 'PERCENT')).toMatch(/50\s*%/)
  })

  it('date branch with relative in date block does not match (short takes precedence)', () => {
    const d = new Date(Date.now() - 86400 * 1000)
    expect(format(d, 'short')).toMatch(/\w{3}\s+\d+/)
  })

  it('respects options in format', () => {
    expect(format(0, '0,0', { zeroFormat: 'N/A' })).toBe('N/A')
    expect(format(null, '0,0', { nullFormat: '—' })).toBe('—')
  })
})

describe('format re-exports', () => {
  it('setDefaultLocale and getDefaultLocale work', () => {
    setDefaultLocale('pt-BR')
    expect(getDefaultLocale()).toBe('pt-BR')
    setDefaultLocale(undefined)
    expect(getDefaultLocale()).toBeUndefined()
  })
})
