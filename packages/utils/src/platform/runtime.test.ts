import { describe, expect, it } from 'vitest'

import { isClient, isServer } from './runtime'

describe('platform/runtime', () => {
  it('should export isClient as boolean', () => {
    expect(typeof isClient).toBe('boolean')
  })

  it('should export isServer as boolean', () => {
    expect(typeof isServer).toBe('boolean')
  })

  it('should have isClient and isServer be opposites', () => {
    expect(isClient).not.toBe(isServer)
  })

  it('should be server in Node.js test environment', () => {
    expect(isServer).toBe(true)
    expect(isClient).toBe(false)
  })
})
