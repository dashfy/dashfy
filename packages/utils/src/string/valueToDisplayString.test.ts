import { describe, expect, it } from 'vitest'

import { valueToDisplayString } from './valueToDisplayString'

describe('valueToDisplayString', () => {
  it('should return "null" for null', () => {
    expect(valueToDisplayString(null)).toBe('null')
  })

  it('should return "undefined" for undefined', () => {
    expect(valueToDisplayString(undefined)).toBe('undefined')
  })

  it('should return string as-is', () => {
    expect(valueToDisplayString('hello')).toBe('hello')
  })

  it('should convert number to string', () => {
    expect(valueToDisplayString(42)).toBe('42')
    expect(valueToDisplayString(3.14)).toBe('3.14')
  })

  it('should convert boolean to string', () => {
    expect(valueToDisplayString(true)).toBe('true')
    expect(valueToDisplayString(false)).toBe('false')
  })

  it('should return Array(n) for arrays', () => {
    expect(valueToDisplayString([1, 2, 3])).toBe('Array(3)')
    expect(valueToDisplayString([])).toBe('Array(0)')
  })

  it('should return Object(n) for objects', () => {
    expect(valueToDisplayString({ a: 1, b: 2 })).toBe('Object(2)')
    expect(valueToDisplayString({})).toBe('Object(0)')
  })

  it('should handle nested objects', () => {
    expect(valueToDisplayString({ a: { b: 1 } })).toBe('Object(1)')
  })

  it('should handle symbol fallback', () => {
    const sym = Symbol('test')
    const result = valueToDisplayString(sym)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle bigint fallback', () => {
    expect(valueToDisplayString(BigInt(42))).toBe('42')
  })
})
