import { describe, expect, it } from 'vitest'

import { get } from './get'

describe('get', () => {
  it('should return top-level property', () => {
    const obj = { name: 'John', age: 30 }
    expect(get(obj, 'name')).toBe('John')
    expect(get(obj, 'age')).toBe(30)
  })

  it('should return nested property with dot notation', () => {
    const obj = { user: { address: { city: 'NYC', zip: '10001' } } }
    expect(get(obj, 'user.address.city')).toBe('NYC')
    expect(get(obj, 'user.address.zip')).toBe('10001')
  })

  it('should return undefined for non-existent path', () => {
    const obj = { name: 'John' }
    expect(get(obj, 'address')).toBeUndefined()
    expect(get(obj, 'address.city')).toBeUndefined()
  })

  it('should return undefined when intermediate path does not exist', () => {
    const obj = { user: { name: 'John' } }
    expect(get(obj, 'user.profile.avatar')).toBeUndefined()
  })

  it('should return undefined for empty path segment', () => {
    const obj = { a: { b: 1 } }
    expect(get(obj, 'a..b')).toBeUndefined()
  })

  it('should return value for single key path', () => {
    const obj = { metrics: { cpu: { usage: 75 } } }
    expect(get(obj, 'metrics')).toEqual({ cpu: { usage: 75 } })
    expect(get(obj, 'metrics.cpu')).toEqual({ usage: 75 })
    expect(get(obj, 'metrics.cpu.usage')).toBe(75)
  })

  it('should handle array values in path', () => {
    const obj = { items: [1, 2, 3], nested: { arr: ['a', 'b'] } }
    expect(get(obj, 'items')).toEqual([1, 2, 3])
    expect(get(obj, 'nested.arr')).toEqual(['a', 'b'])
  })

  it('should handle null and undefined values in object', () => {
    const obj = { a: null, b: undefined, c: { d: 1 } }
    expect(get(obj, 'a')).toBe(null)
    expect(get(obj, 'b')).toBeUndefined()
    expect(get(obj, 'c.d')).toBe(1)
  })
})
