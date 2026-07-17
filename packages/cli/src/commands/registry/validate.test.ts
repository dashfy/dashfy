import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { registryValidate } from '@/commands/registry/validate'
import type { RegistryItem } from '@/schema'
import { buildLocalRegistry } from '@/test/local-registry'

async function tmp(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-validate-cmd-'))
}

function makeItem(overrides: Partial<RegistryItem> = {}): RegistryItem {
  return {
    name: 'github',
    type: 'registry:extension',
    title: 'GitHub',
    description: 'GitHub widgets',
    dependencies: ['@dashfy/ext-github@^0.1.0'],
    categories: ['developer'],
    meta: { extensionKey: 'github', widgets: ['GitHubStars'] },
    ...overrides,
  }
}

let cleanups: string[] = []
const previousExitCode = process.exitCode

beforeEach(() => {
  process.exitCode = 0
})

afterEach(async () => {
  process.exitCode = previousExitCode
  vi.restoreAllMocks()
  await Promise.all(cleanups.map((dir) => fs.remove(dir).catch(() => undefined)))
  cleanups = []
})

describe('registry validate', () => {
  it('exits 0 for a valid registry', async () => {
    const dir = await buildLocalRegistry()
    cleanups.push(dir)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await registryValidate.parseAsync([dir], { from: 'user' })

    expect(process.exitCode).toBe(0)
  })

  it('sets exitCode to 1 for an invalid registry', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    await fs.writeJson(path.join(dir, 'gh.json'), makeItem({ name: 'github' }))
    await fs.writeJson(path.join(dir, 'index.json'), { name: 'test', items: [] })
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await registryValidate.parseAsync([dir], { from: 'user' })

    expect(process.exitCode).toBe(1)
  })

  it('emits a parseable JSON report with --json', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    const item = makeItem({ name: 'github' })
    await fs.writeJson(path.join(dir, 'github.json'), item)
    await fs.writeJson(path.join(dir, 'index.json'), {
      name: 'test',
      items: [
        {
          name: item.name,
          type: item.type,
          title: item.title,
          description: item.description,
          categories: item.categories,
        },
      ],
    })

    const lines: string[] = []
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      lines.push(String(message))
    })

    await registryValidate.parseAsync([dir, '--json'], { from: 'user' })

    const report = JSON.parse(lines.join('\n'))
    expect(report.valid).toBe(true)
    expect(report.dir).toBe(dir)
    expect(process.exitCode).toBe(0)
  })

  it('reports invalid via JSON and non-zero exit', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    await fs.writeJson(path.join(dir, 'github.json'), { name: 'github' })
    await fs.writeJson(path.join(dir, 'index.json'), { name: 'test', items: [] })

    const lines: string[] = []
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      lines.push(String(message))
    })

    await registryValidate.parseAsync([dir, '--json'], { from: 'user' })

    const report = JSON.parse(lines.join('\n'))
    expect(report.valid).toBe(false)
    expect(report.diagnostics.length).toBeGreaterThan(0)
    expect(process.exitCode).toBe(1)
  })
})
