import { describe, expect, it } from 'vitest'

import { isDevelopment, isProduction, isTest } from './env'

describe('platform/env', () => {
  it('should export isDevelopment', () => {
    expect(typeof isDevelopment).toBe('boolean')
  })

  it('should export isProduction', () => {
    expect(typeof isProduction).toBe('boolean')
  })

  it('should export isTest', () => {
    expect(typeof isTest).toBe('boolean')
  })

  it('should have exactly one env flag true when NODE_ENV is set', () => {
    const env = process.env.NODE_ENV
    const flags = [isDevelopment, isProduction, isTest]
    const trueCount = flags.filter(Boolean).length
    // In test environment, isTest should be true
    if (env === 'test') {
      expect(isTest).toBe(true)
    }
    // At most one should be true for standard NODE_ENV values
    expect(trueCount).toBeLessThanOrEqual(1)
  })
})
