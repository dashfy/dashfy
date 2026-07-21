import { describe, expect, it } from 'vitest'

import { parseRegistryAndItemFromString } from '@/registry/parser'

describe('parseRegistryAndItemFromString', () => {
  it('splits a namespaced address', () => {
    expect(parseRegistryAndItemFromString('@getdashfy/github')).toEqual({
      registry: '@getdashfy',
      item: 'github',
    })
  })

  it('keeps nested item paths', () => {
    expect(parseRegistryAndItemFromString('@acme/group/widget')).toEqual({
      registry: '@acme',
      item: 'group/widget',
    })
  })

  it('returns null registry for bare names', () => {
    expect(parseRegistryAndItemFromString('github')).toEqual({
      registry: null,
      item: 'github',
    })
  })

  it('returns null registry for malformed @ addresses', () => {
    expect(parseRegistryAndItemFromString('@github')).toEqual({
      registry: null,
      item: '@github',
    })
  })
})
