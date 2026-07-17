import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearRegistryCache } from '@/registry/fetcher'
import { resolveConfig } from '@/utils/get-config'
import { ensureRegistries } from '@/utils/registries'

async function tmp(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-ensure-'))
}

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

describe('ensureRegistries', () => {
  it('returns added [] for already-known namespaces', async () => {
    const cwd = await tmp()
    const config = await resolveConfig(cwd)
    const result = await ensureRegistries(['github', '@dashfy/github'], config, {
      cwd,
      persist: false,
    })
    expect(result.added).toEqual([])
    expect(result.registries).toBe(config.registries)
  })

  it('resolves unknown namespaces in memory without writing when persist is false', async () => {
    const cwd = await tmp()
    process.env.DASHFY_REGISTRIES_URL = await writeIndex({
      '@acme': { url: 'https://acme.com/r/{name}.json' },
    })
    const config = await resolveConfig(cwd)
    const result = await ensureRegistries(['@acme/widget'], config, { cwd, persist: false })

    expect(result.added).toEqual(['@acme'])
    expect(result.registries['@acme']).toBe('https://acme.com/r/{name}.json')
    expect(await fs.pathExists(path.join(cwd, 'dashfy.json'))).toBe(false)
  })

  it('persists resolved namespaces when persist is true', async () => {
    const cwd = await tmp()
    process.env.DASHFY_REGISTRIES_URL = await writeIndex({
      '@acme': { url: 'https://acme.com/r/{name}.json' },
    })
    const config = await resolveConfig(cwd)
    const result = await ensureRegistries(['@acme/widget'], config, {
      cwd,
      persist: true,
      yes: true,
      silent: true,
    })

    expect(result.added).toEqual(['@acme'])
    const written = await fs.readJson(path.join(cwd, 'dashfy.json'))
    expect(written.registries['@acme']).toBe('https://acme.com/r/{name}.json')
  })

  it('throws when an unknown namespace is not in the discovery index', async () => {
    const cwd = await tmp()
    process.env.DASHFY_REGISTRIES_URL = await writeIndex({})
    const config = await resolveConfig(cwd)
    await expect(
      ensureRegistries(['@missing/widget'], config, { cwd, persist: false }),
    ).rejects.toThrow(/Unknown registry namespace/)
  })
})
