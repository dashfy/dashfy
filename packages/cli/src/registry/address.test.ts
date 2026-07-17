import { describe, expect, it } from 'vitest'

import { resolveItemAddress } from '@/registry/address'
import { BUILTIN_REGISTRY_NAMESPACE } from '@/registry/constants'

describe('resolveItemAddress', () => {
  it('resolves bare names to the default @dashfy namespace', () => {
    expect(resolveItemAddress('github')).toEqual({
      scheme: 'namespace',
      namespace: BUILTIN_REGISTRY_NAMESPACE,
      item: 'github',
    })
  })

  it('resolves explicit namespaces', () => {
    expect(resolveItemAddress('@acme/github')).toEqual({
      scheme: 'namespace',
      namespace: '@acme',
      item: 'github',
    })
  })

  it('resolves http(s) URLs', () => {
    expect(resolveItemAddress('https://example.com/r/github.json')).toEqual({
      scheme: 'url',
      url: 'https://example.com/r/github.json',
    })
  })

  it('resolves local .json files', () => {
    expect(resolveItemAddress('./local/github.json')).toEqual({
      scheme: 'file',
      path: './local/github.json',
    })
  })

  it('resolves GitHub owner/repo/item addresses', () => {
    expect(resolveItemAddress('acme/dashfy-ext/github')).toEqual({
      scheme: 'github',
      owner: 'acme',
      repo: 'dashfy-ext',
      item: 'github',
      ref: undefined,
    })
  })

  it('resolves GitHub addresses with a ref', () => {
    expect(resolveItemAddress('acme/dashfy-ext/github#next')).toEqual({
      scheme: 'github',
      owner: 'acme',
      repo: 'dashfy-ext',
      item: 'github',
      ref: 'next',
    })
  })
})
