import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ensureNamespacesConfigured } from '@/commands/add'
import { clearRegistryCache } from '@/registry/fetcher'
import { resolveConfig } from '@/utils/get-config'

async function tmp(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-add-'))
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

describe('ensureNamespacesConfigured', () => {
  it('returns the config unchanged for built-in namespaces', async () => {
    const cwd = await tmp()
    const config = await resolveConfig(cwd)
    const result = await ensureNamespacesConfigured(
      ['github', '@getdashfy/github'],
      config,
      cwd,
      true,
    )
    expect(result).toBe(config)
    expect(await fs.pathExists(path.join(cwd, 'dashfy.json'))).toBe(false)
  })

  it('auto-adds an unknown namespace resolved from the discovery index', async () => {
    const cwd = await tmp()
    process.env.DASHFY_REGISTRIES_URL = await writeIndex({
      '@acme': { url: 'https://acme.com/r/{name}.json' },
    })
    const config = await resolveConfig(cwd)
    const result = await ensureNamespacesConfigured(['@acme/widget'], config, cwd, true)
    expect(result.registries['@acme']).toBe('https://acme.com/r/{name}.json')
    const written = await fs.readJson(path.join(cwd, 'dashfy.json'))
    expect(written.registries['@acme']).toBe('https://acme.com/r/{name}.json')
  })

  it('throws when an unknown namespace is not in the discovery index', async () => {
    const cwd = await tmp()
    process.env.DASHFY_REGISTRIES_URL = await writeIndex({})
    const config = await resolveConfig(cwd)
    await expect(
      ensureNamespacesConfigured(['@unknown/widget'], config, cwd, true),
    ).rejects.toThrow(/Unknown registry namespace/)
  })
})
