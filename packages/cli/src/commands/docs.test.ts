import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearRegistryCache } from '@/registry/fetcher'
import { buildLocalRegistry, localRegistries } from '@/test/local-registry'
import type * as GetPackageManagerModule from '@/utils/get-package-manager'

import { docs } from './docs'

vi.mock('@/utils/get-package-manager', async (importOriginal) => ({
  ...(await importOriginal<typeof GetPackageManagerModule>()),
  getPackageManager: vi.fn(() => Promise.resolve('pnpm')),
}))

async function tmp(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-docs-'))
}

beforeEach(() => {
  clearRegistryCache()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('docs', () => {
  it('prints human-readable setup and integration docs', async () => {
    const dir = await buildLocalRegistry()
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), { registries: localRegistries(dir) })

    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      logs.push(String(message))
    })

    await docs.parseAsync(['github', '-c', cwd], { from: 'user' })

    const output = logs.join('\n')
    expect(output).toContain('@dashfy/github — GitHub')
    expect(output).toContain('Setup')
    expect(output).toContain('GITHUB_TOKEN')
    expect(output).toContain('pnpm dlx dashfy@latest add @dashfy/github')
  })

  it('emits structured JSON with --json', async () => {
    const dir = await buildLocalRegistry()
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), { registries: localRegistries(dir) })

    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      logs.push(String(message))
    })

    await docs.parseAsync(['github', '-c', cwd, '--json'], { from: 'user' })

    const payload = JSON.parse(logs.join('\n')) as {
      items: { address: string; setup?: string; envVars?: string[]; addCommand: string }[]
    }
    expect(payload.items[0]?.address).toBe('@dashfy/github')
    expect(payload.items[0]?.envVars).toContain('GITHUB_TOKEN')
    expect(payload.items[0]?.addCommand).toBe('pnpm dlx dashfy@latest add @dashfy/github')
  })
})
