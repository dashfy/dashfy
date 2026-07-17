import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { getRegistryIndex, getRegistryItem } from '@/registry/api'
import { clearRegistryCache } from '@/registry/fetcher'
import { resolveRegistryItems } from '@/registry/resolver'
import type { RegistryConfig } from '@/schema'
import { buildLocalRegistry, localRegistries } from '@/test/local-registry'

let registryDir: string
let acmeDir: string

beforeAll(async () => {
  registryDir = await buildLocalRegistry()

  // A third-party "@acme" registry whose item depends on a @dashfy extension.
  acmeDir = await mkdtemp(path.join(tmpdir(), 'dashfy-acme-'))
  await fs.writeJson(path.join(acmeDir, 'analytics.json'), {
    name: 'analytics',
    type: 'registry:extension',
    title: 'Acme Analytics',
    dependencies: ['@acme/ext-analytics@^1.0.0'],
    registryDependencies: ['@dashfy/json'],
    meta: { extensionKey: 'analytics', widgets: ['AnalyticsBoard'] },
  })
  clearRegistryCache()
})

afterAll(async () => {
  await fs.remove(registryDir)
  await fs.remove(acmeDir)
})

function combinedRegistries(): RegistryConfig {
  return {
    ...localRegistries(registryDir),
    '@acme': `${acmeDir}/{name}.json`,
  }
}

describe('registry api (local source)', () => {
  it('fetches a single item by bare name (default @dashfy)', async () => {
    const item = await getRegistryItem('github', {
      registries: localRegistries(registryDir),
      useCache: false,
    })
    expect(item.name).toBe('github')
    expect(item.meta.client?.factory).toBe('createGitHubClient')
    expect(item.envVars).toContain('GITHUB_TOKEN')
  })

  it('fetches the catalog index', async () => {
    const index = await getRegistryIndex({
      registries: localRegistries(registryDir),
      useCache: false,
    })
    expect(index.items.map((item) => item.name)).toEqual(
      expect.arrayContaining(['github', 'json', 'nba', 'system', 'market-live']),
    )
  })
})

describe('resolveRegistryItems', () => {
  it('returns a single item when there are no registry dependencies', async () => {
    const items = await resolveRegistryItems(['@dashfy/github'], {
      registries: localRegistries(registryDir),
      useCache: false,
    })
    expect(items.map((item) => item.name)).toEqual(['github'])
  })

  it('resolves registryDependencies from a custom namespace, dependencies first', async () => {
    const items = await resolveRegistryItems(['@acme/analytics'], {
      registries: combinedRegistries(),
      useCache: false,
    })
    expect(items.map((item) => item.name)).toEqual(['json', 'analytics'])
  })

  it('de-duplicates items requested more than once', async () => {
    const items = await resolveRegistryItems(['github', '@dashfy/github'], {
      registries: localRegistries(registryDir),
      useCache: false,
    })
    expect(items.map((item) => item.name)).toEqual(['github'])
  })
})
