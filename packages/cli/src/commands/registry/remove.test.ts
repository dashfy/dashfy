import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { registryRemove } from '@/commands/registry/remove'

async function tmp(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-registry-remove-'))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('registry remove', () => {
  it('removes a configured namespace', async () => {
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), {
      registries: { '@acme': 'https://acme.com/r/{name}.json' },
    })

    await registryRemove.parseAsync(['@acme', '-c', cwd, '-s'], { from: 'user' })

    const config = await fs.readJson(path.join(cwd, 'dashfy.json'))
    expect(config.registries).toBeUndefined()
  })

  it('leaves other registries intact', async () => {
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), {
      registries: {
        '@acme': 'https://acme.com/r/{name}.json',
        '@beta': 'https://beta.dev/r/{name}.json',
      },
    })

    await registryRemove.parseAsync(['@acme', '-c', cwd, '-s'], { from: 'user' })

    const config = await fs.readJson(path.join(cwd, 'dashfy.json'))
    expect(config.registries['@acme']).toBeUndefined()
    expect(config.registries['@beta']).toBe('https://beta.dev/r/{name}.json')
  })

  it('drops the registries key entirely when the last one is removed', async () => {
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), {
      registries: { '@acme': 'https://acme.com/r/{name}.json' },
    })

    await registryRemove.parseAsync(['@acme', '-c', cwd, '-s'], { from: 'user' })

    const config = await fs.readJson(path.join(cwd, 'dashfy.json'))
    expect('registries' in config).toBe(false)
  })

  it('is a no-op when the namespace is not configured', async () => {
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), {
      registries: { '@acme': 'https://acme.com/r/{name}.json' },
    })

    await registryRemove.parseAsync(['@ghost', '-c', cwd, '-s'], { from: 'user' })

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
      registryRemove.parseAsync(['acme', '-c', cwd, '-s'], { from: 'user' }),
    ).rejects.toThrow()
    expect(exit).toHaveBeenCalledWith(1)
  })
})
