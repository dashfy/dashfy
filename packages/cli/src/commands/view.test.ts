import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearRegistryCache } from '@/registry/fetcher'
import { buildLocalRegistry, localRegistries } from '@/test/local-registry'

import { view } from './view'

async function tmp(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-view-'))
}

beforeEach(() => {
  clearRegistryCache()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('view', () => {
  it('prints the full registry item JSON for an address', async () => {
    const dir = await buildLocalRegistry()
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), { registries: localRegistries(dir) })

    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      logs.push(String(message))
    })

    await view.parseAsync(['github', '-c', cwd], { from: 'user' })

    const payload = JSON.parse(logs.join('\n')) as { name: string; type: string }[]
    expect(Array.isArray(payload)).toBe(true)
    expect(payload[0]?.name).toBe('github')
    expect(payload[0]?.type).toBe('registry:extension')
  })
})
