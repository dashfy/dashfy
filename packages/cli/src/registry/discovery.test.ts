import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { REGISTRIES_INDEX_URL } from '@/registry/constants'
import {
  fetchRegistriesIndex,
  resolveNamespaceUrl,
  resolveRegistriesIndexUrl,
} from '@/registry/discovery'
import { clearRegistryCache } from '@/registry/fetcher'

async function writeIndex(registries: Record<string, { url: string }>): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-discovery-'))
  const file = path.join(dir, 'registries.json')
  await fs.writeJson(file, { registries })
  return file
}

beforeEach(() => {
  clearRegistryCache()
})

afterEach(() => {
  delete process.env.DASHFY_REGISTRIES_URL
})

describe('resolveRegistriesIndexUrl', () => {
  it('defaults to the hosted registries.json', () => {
    expect(resolveRegistriesIndexUrl()).toBe(REGISTRIES_INDEX_URL)
  })

  it('uses DASHFY_REGISTRIES_URL when it points at a .json file', () => {
    process.env.DASHFY_REGISTRIES_URL = '/tmp/custom.json'
    expect(resolveRegistriesIndexUrl()).toBe('/tmp/custom.json')
  })

  it('appends registries.json to a directory override', () => {
    process.env.DASHFY_REGISTRIES_URL = '/tmp/dir/'
    expect(resolveRegistriesIndexUrl()).toBe('/tmp/dir/registries.json')
  })
})

describe('fetchRegistriesIndex', () => {
  it('reads and validates a local discovery index', async () => {
    process.env.DASHFY_REGISTRIES_URL = await writeIndex({
      '@acme': { url: 'https://acme.com/r/{name}.json' },
    })
    const index = await fetchRegistriesIndex(false)
    expect(index.registries['@acme']?.url).toBe('https://acme.com/r/{name}.json')
  })

  it('throws on an invalid index', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-discovery-'))
    const file = path.join(dir, 'registries.json')
    await fs.writeJson(file, { registries: { acme: { url: 'no-placeholder' } } })
    process.env.DASHFY_REGISTRIES_URL = file
    await expect(fetchRegistriesIndex(false)).rejects.toThrow()
  })
})

describe('resolveNamespaceUrl', () => {
  it('returns the URL for a known namespace and undefined otherwise', async () => {
    process.env.DASHFY_REGISTRIES_URL = await writeIndex({
      '@acme': { url: 'https://acme.com/r/{name}.json' },
    })
    expect(await resolveNamespaceUrl('@acme', false)).toBe('https://acme.com/r/{name}.json')
    expect(await resolveNamespaceUrl('@missing', false)).toBeUndefined()
  })
})
