import { describe, expect, it } from 'vitest'

import { DEFAULT_APP_PATH, DEFAULT_ENV_PATH } from '@/constants/paths'
import { dashfyConfigSchema, registryConfigSchema, registryItemSchema } from '@/schema'

const validItem = {
  name: 'github',
  type: 'registry:extension' as const,
  title: 'GitHub',
  dependencies: ['@getdashfy/ext-github@^0.1.0'],
  envVars: ['GITHUB_TOKEN'],
  registryDependencies: ['@getdashfy/json'],
  meta: {
    extensionKey: 'github',
    widgets: ['UserBadge'],
    client: {
      import: '@getdashfy/ext-github',
      factory: 'createGitHubClient',
      mode: 'poll' as const,
    },
  },
}

describe('registryItemSchema', () => {
  it('accepts a well-formed extension item', () => {
    expect(registryItemSchema.parse(validItem)).toMatchObject({ name: 'github' })
  })

  it('requires at least one dependency', () => {
    expect(registryItemSchema.safeParse({ ...validItem, dependencies: [] }).success).toBe(false)
  })

  it('requires at least one widget', () => {
    expect(
      registryItemSchema.safeParse({
        ...validItem,
        meta: { ...validItem.meta, widgets: [] },
      }).success,
    ).toBe(false)
  })
})

describe('registryConfigSchema', () => {
  it('requires @-prefixed namespaces', () => {
    expect(
      registryConfigSchema.safeParse({ dashfy: 'https://r.dashfy.dev/{name}.json' }).success,
    ).toBe(false)
  })

  it('requires the {name} placeholder', () => {
    expect(
      registryConfigSchema.safeParse({ '@getdashfy': 'https://r.dashfy.dev/github.json' }).success,
    ).toBe(false)
  })

  it('accepts string and object registry endpoints', () => {
    const parsed = registryConfigSchema.parse({
      '@getdashfy': 'https://r.dashfy.dev/{name}.json',
      '@acme': { url: 'https://acme.com/r/{name}.json', headers: { Authorization: 'Bearer x' } },
    })
    expect(Object.keys(parsed)).toEqual(['@getdashfy', '@acme'])
  })
})

describe('dashfyConfigSchema', () => {
  it('accepts registries and paths', () => {
    const parsed = dashfyConfigSchema.parse({
      registries: { '@acme': 'https://acme.com/r/{name}.json' },
      paths: { app: DEFAULT_APP_PATH, env: DEFAULT_ENV_PATH },
    })
    expect(parsed.paths?.app).toBe(DEFAULT_APP_PATH)
  })

  it('accepts an empty config', () => {
    expect(dashfyConfigSchema.parse({})).toEqual({})
  })
})
