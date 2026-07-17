import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { registryAdd } from '@/commands/registry/add'
import { clearRegistryCache } from '@/registry/fetcher'

async function tmp(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-registry-add-'))
}

async function writeIndex(
  registries: Record<string, { url: string; name?: string }>,
): Promise<string> {
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
  vi.restoreAllMocks()
})

describe('registry add', () => {
  it('adds a registry from an explicit namespace=url pair', async () => {
    const cwd = await tmp()
    await registryAdd.parseAsync(['@acme=https://acme.com/r/{name}.json', '-c', cwd, '-s'], {
      from: 'user',
    })
    const config = await fs.readJson(path.join(cwd, 'dashfy.json'))
    expect(config.registries['@acme']).toBe('https://acme.com/r/{name}.json')
  })

  it('resolves a bare namespace from the discovery index', async () => {
    const cwd = await tmp()
    process.env.DASHFY_REGISTRIES_URL = await writeIndex({
      '@beta': { url: 'https://beta.dev/r/{name}.json', name: 'Beta' },
    })
    await registryAdd.parseAsync(['@beta', '-c', cwd, '-s'], { from: 'user' })
    const config = await fs.readJson(path.join(cwd, 'dashfy.json'))
    expect(config.registries['@beta']).toBe('https://beta.dev/r/{name}.json')
  })

  it('skips namespaces that are already configured', async () => {
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), {
      registries: { '@acme': 'https://acme.com/r/{name}.json' },
    })
    await registryAdd.parseAsync(['@acme=https://other.com/r/{name}.json', '-c', cwd, '-s'], {
      from: 'user',
    })
    const config = await fs.readJson(path.join(cwd, 'dashfy.json'))
    expect(config.registries['@acme']).toBe('https://acme.com/r/{name}.json')
  })

  it('rejects a non-@ namespace', async () => {
    const cwd = await tmp()
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit')
    }) as never)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await expect(
      registryAdd.parseAsync(['acme=https://acme.com/r/{name}.json', '-c', cwd, '-s'], {
        from: 'user',
      }),
    ).rejects.toThrow()
    expect(exit).toHaveBeenCalledWith(1)
  })
})
