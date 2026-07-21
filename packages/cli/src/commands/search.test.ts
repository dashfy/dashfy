import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearRegistryCache } from '@/registry/fetcher'
import { buildLocalRegistry, localRegistries } from '@/test/local-registry'
import type * as GetPackageManagerModule from '@/utils/get-package-manager'
import { setOutputMode } from '@/utils/output'

import { search } from './search'

vi.mock('@/utils/get-package-manager', async (importOriginal) => ({
  ...(await importOriginal<typeof GetPackageManagerModule>()),
  getPackageManager: vi.fn(() => Promise.resolve('pnpm')),
}))

async function tmp(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-search-'))
}

beforeEach(() => {
  clearRegistryCache()
})

afterEach(() => {
  setOutputMode({ json: false, silent: false })
  process.exitCode = 0
  vi.restoreAllMocks()
})

describe('search', () => {
  it('outputs JSON results for an explicit registry', async () => {
    const dir = await buildLocalRegistry()
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), { registries: localRegistries(dir) })

    setOutputMode({ json: true })
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      logs.push(String(message))
    })

    await search.parseAsync(['@getdashfy', '-c', cwd], { from: 'user' })

    expect(process.exitCode).toBe(0)
    const payload = JSON.parse(logs.join('\n')) as {
      results: { registry: string; items: { name: string }[] }[]
    }
    const group = payload.results.find((entry) => entry.registry === '@getdashfy')
    expect(group?.items.length ?? 0).toBeGreaterThan(0)
  })

  it('prints runner-prefixed add commands in human output', async () => {
    const dir = await buildLocalRegistry()
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), { registries: localRegistries(dir) })

    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      logs.push(String(message))
    })

    await search.parseAsync(['@getdashfy', '--query', 'github', '-c', cwd], { from: 'user' })

    expect(logs.join('\n')).toContain('pnpm dlx dashfy@latest add @getdashfy/github')
  })

  it('rejects unknown --type values', async () => {
    const cwd = await tmp()
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit')
    }) as never)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await expect(
      search.parseAsync(['@getdashfy', '--type', 'bogus', '-c', cwd], { from: 'user' }),
    ).rejects.toThrow('process.exit')
    expect(exit).toHaveBeenCalledWith(1)
  })
})
