import { afterEach, describe, expect, it } from 'vitest'

import { buildUrlAndHeadersForRegistryItem, withBuiltinRegistries } from '@/registry/builder'
import { BUILTIN_REGISTRY_NAMESPACE } from '@/registry/constants'
import {
  RegistryMissingEnvironmentVariablesError,
  RegistryNotConfiguredError,
} from '@/registry/errors'
import type { RegistryConfig } from '@/schema'

const TOKEN = 'DASHFY_TEST_REGISTRY_TOKEN'

afterEach(() => {
  delete process.env[TOKEN]
})

describe('buildUrlAndHeadersForRegistryItem', () => {
  it('resolves the default @dashfy namespace for bare names', () => {
    const registries: RegistryConfig = {
      [BUILTIN_REGISTRY_NAMESPACE]: 'https://r.dashfy.dev/{name}.json',
    }
    expect(buildUrlAndHeadersForRegistryItem('github', registries)).toEqual({
      url: 'https://r.dashfy.dev/github.json',
      headers: {},
    })
  })

  it('resolves explicit namespaces with auth headers and env expansion', () => {
    process.env[TOKEN] = 'abc123'
    const registries: RegistryConfig = {
      [BUILTIN_REGISTRY_NAMESPACE]: 'https://r.dashfy.dev/{name}.json',
      '@acme': {
        url: 'https://acme.com/r/{name}.json',
        headers: { Authorization: `Bearer \${${TOKEN}}` },
      },
    }
    expect(buildUrlAndHeadersForRegistryItem('@acme/widget', registries)).toEqual({
      url: 'https://acme.com/r/widget.json',
      headers: { Authorization: 'Bearer abc123' },
    })
  })

  it('appends query params', () => {
    const registries: RegistryConfig = {
      '@acme': { url: 'https://acme.com/r/{name}.json', params: { v: '2' } },
    }
    expect(buildUrlAndHeadersForRegistryItem('@acme/widget', registries).url).toBe(
      'https://acme.com/r/widget.json?v=2',
    )
  })

  it('throws for unknown namespaces', () => {
    expect(() => buildUrlAndHeadersForRegistryItem('@nope/widget', {})).toThrow(
      RegistryNotConfiguredError,
    )
  })

  it('throws when a required env var is missing', () => {
    const registries: RegistryConfig = {
      '@acme': {
        url: 'https://acme.com/r/{name}.json',
        headers: { Authorization: `Bearer \${${TOKEN}}` },
      },
    }
    expect(() => buildUrlAndHeadersForRegistryItem('@acme/widget', registries)).toThrow(
      RegistryMissingEnvironmentVariablesError,
    )
  })
})

describe('withBuiltinRegistries', () => {
  it('always includes the @dashfy namespace', () => {
    expect(withBuiltinRegistries()[BUILTIN_REGISTRY_NAMESPACE]).toBeDefined()
  })

  it('lets user registries override the built-ins', () => {
    const merged = withBuiltinRegistries({
      [BUILTIN_REGISTRY_NAMESPACE]: 'file:///tmp/{name}.json',
    })
    expect(merged[BUILTIN_REGISTRY_NAMESPACE]).toBe('file:///tmp/{name}.json')
  })
})
