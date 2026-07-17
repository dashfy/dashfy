import { describe, expect, it } from 'vitest'

import { truncate } from './truncate'

describe('truncate', () => {
  it('should truncate long string and add ellipsis', () => {
    expect(truncate('Hello, World!', 5)).toBe('Hello...')
  })

  it('should return original string when shorter than length', () => {
    expect(truncate('Short', 10)).toBe('Short')
  })

  it('should return original string when equal to length', () => {
    expect(truncate('Exactly', 7)).toBe('Exactly')
  })

  it('should truncate at exact length boundary', () => {
    expect(truncate('abcdefgh', 4)).toBe('abcd...')
  })

  it('should handle empty string', () => {
    expect(truncate('', 5)).toBe('')
  })

  it('should handle length of 0', () => {
    expect(truncate('hello', 0)).toBe('...')
  })

  it('should handle long descriptions', () => {
    const description = 'This is a very long description that needs truncation'
    expect(truncate(description, 20)).toBe('This is a very long ...')
  })
})
