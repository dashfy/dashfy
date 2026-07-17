import { describe, expect, it } from 'vitest'

import { stringifyValue } from './stringifyValue'

describe('stringifyValue', () => {
  it('should return empty string for null', () => {
    expect(stringifyValue(null)).toBe('')
  })

  it('should return empty string for undefined', () => {
    expect(stringifyValue(undefined)).toBe('')
  })

  it('should return string as-is', () => {
    expect(stringifyValue('hello')).toBe('hello')
  })

  it('should convert number to string', () => {
    expect(stringifyValue(42)).toBe('42')
    expect(stringifyValue(3.14)).toBe('3.14')
  })

  it('should convert boolean to string', () => {
    expect(stringifyValue(true)).toBe('true')
    expect(stringifyValue(false)).toBe('false')
  })

  it('should JSON.stringify objects', () => {
    expect(stringifyValue({ name: 'John', age: 30 })).toBe('{"name":"John","age":30}')
  })

  it('should JSON.stringify arrays', () => {
    expect(stringifyValue([1, 2, 3])).toBe('[1,2,3]')
  })

  it('should handle nested objects', () => {
    expect(stringifyValue({ a: { b: 1 } })).toBe('{"a":{"b":1}}')
  })

  it('should handle empty object', () => {
    expect(stringifyValue({})).toBe('{}')
  })

  it('should handle empty array', () => {
    expect(stringifyValue([])).toBe('[]')
  })
})
