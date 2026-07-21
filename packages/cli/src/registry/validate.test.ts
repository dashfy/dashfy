import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'

import { validateRegistry } from '@/registry/validate'
import type { RegistryIndex, RegistryItem } from '@/schema'
import { buildLocalRegistry } from '@/test/local-registry'

async function tmp(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-validate-'))
}

function makeItem(overrides: Partial<RegistryItem> = {}): RegistryItem {
  return {
    name: 'github',
    type: 'registry:extension',
    title: 'GitHub',
    description: 'GitHub widgets',
    dependencies: ['@getdashfy/ext-github@^0.1.0'],
    categories: ['developer'],
    meta: {
      extensionKey: 'github',
      widgets: ['GitHubStars'],
    },
    ...overrides,
  }
}

function indexEntry(item: RegistryItem): RegistryIndex['items'][number] {
  return {
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    categories: item.categories,
  }
}

async function writeRegistry(
  dir: string,
  items: RegistryItem[],
  indexOverride?: Partial<RegistryIndex>,
): Promise<void> {
  for (const item of items) {
    await fs.writeJson(path.join(dir, `${item.name}.json`), item)
  }
  const index: RegistryIndex = {
    name: 'test',
    items: items.map(indexEntry),
    ...indexOverride,
  }
  await fs.writeJson(path.join(dir, 'index.json'), index)
}

let cleanups: string[] = []

afterEach(async () => {
  await Promise.all(cleanups.map((dir) => fs.remove(dir).catch(() => undefined)))
  cleanups = []
})

describe('validateRegistry', () => {
  it('reports a freshly built registry as valid', async () => {
    const dir = await buildLocalRegistry()
    cleanups.push(dir)

    const report = await validateRegistry({ dir })

    expect(report.valid).toBe(true)
    expect(report.diagnostics).toEqual([])
    expect(report.registryFiles).toBeGreaterThan(0)
    expect(report.items).toBe(report.registryFiles)
  })

  it('fails when the directory does not exist', async () => {
    const report = await validateRegistry({ dir: path.join(tmpdir(), 'dashfy-missing-xyz') })

    expect(report.valid).toBe(false)
    expect(report.diagnostics).toHaveLength(1)
    expect(report.diagnostics[0]?.message).toMatch(/not found or is not a directory/)
  })

  it('fails when index.json is missing', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    await fs.writeJson(path.join(dir, 'github.json'), makeItem())

    const report = await validateRegistry({ dir })

    expect(report.valid).toBe(false)
    expect(report.diagnostics.some((d) => d.file === 'index.json')).toBe(true)
  })

  it('reports invalid item schema with zod diagnostics', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    await fs.writeJson(path.join(dir, 'index.json'), { name: 'test', items: [] })
    await fs.writeJson(path.join(dir, 'broken.json'), {
      name: 'broken',
      type: 'registry:extension',
    })

    const report = await validateRegistry({ dir })

    expect(report.valid).toBe(false)
    expect(report.diagnostics.some((d) => d.file === 'broken.json')).toBe(true)
  })

  it('reports invalid JSON', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    await fs.writeJson(path.join(dir, 'index.json'), { name: 'test', items: [] })
    await fs.writeFile(path.join(dir, 'bad.json'), '{ not json')

    const report = await validateRegistry({ dir })

    expect(report.valid).toBe(false)
    expect(
      report.diagnostics.some((d) => d.file === 'bad.json' && d.message.includes('invalid JSON')),
    ).toBe(true)
  })

  it('reports a filename/name mismatch', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    const item = makeItem({ name: 'github' })
    await fs.writeJson(path.join(dir, 'gh.json'), item)
    await fs.writeJson(path.join(dir, 'index.json'), { name: 'test', items: [indexEntry(item)] })

    const report = await validateRegistry({ dir })

    expect(report.valid).toBe(false)
    expect(report.diagnostics.some((d) => d.message.includes('does not match item name'))).toBe(
      true,
    )
  })

  it('reports duplicate item names', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    const a = makeItem({ name: 'a' })
    const b = makeItem({ name: 'a' })
    await fs.writeJson(path.join(dir, 'a.json'), a)
    await fs.writeJson(path.join(dir, 'b.json'), b)
    await fs.writeJson(path.join(dir, 'index.json'), {
      name: 'test',
      items: [indexEntry(a)],
    })

    const report = await validateRegistry({ dir })

    expect(report.valid).toBe(false)
    expect(report.diagnostics.some((d) => d.message.includes('Duplicate registry item name'))).toBe(
      true,
    )
  })

  it('reports index/item mismatches in both directions', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    const item = makeItem({ name: 'github', title: 'GitHub' })
    await fs.writeJson(path.join(dir, 'github.json'), item)
    await fs.writeJson(path.join(dir, 'index.json'), {
      name: 'test',
      items: [
        { ...indexEntry(item), title: 'Different Title' },
        { name: 'ghost', type: 'registry:extension', title: 'Ghost' },
      ],
    })

    const report = await validateRegistry({ dir })

    expect(report.valid).toBe(false)
    expect(report.diagnostics.some((d) => d.message.includes('out of sync'))).toBe(true)
    expect(report.diagnostics.some((d) => d.message.includes('ghost.json is missing'))).toBe(true)
  })

  it('reports an item that is missing from the index', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    const item = makeItem({ name: 'github' })
    await fs.writeJson(path.join(dir, 'github.json'), item)
    await fs.writeJson(path.join(dir, 'index.json'), { name: 'test', items: [] })

    const report = await validateRegistry({ dir })

    expect(report.valid).toBe(false)
    expect(report.diagnostics.some((d) => d.message.includes('is not listed in index.json'))).toBe(
      true,
    )
  })

  it('reports unresolved local registryDependencies', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    const item = makeItem({ name: 'github', registryDependencies: ['@getdashfy/missing', 'base'] })
    await fs.writeJson(path.join(dir, 'github.json'), item)
    await fs.writeJson(path.join(dir, 'index.json'), { name: 'test', items: [indexEntry(item)] })

    const report = await validateRegistry({ dir })

    expect(report.valid).toBe(false)
    const messages = report.diagnostics.map((d) => d.message).join('\n')
    expect(messages).toMatch(/Unresolved registry dependency "@getdashfy\/missing"/)
    expect(messages).toMatch(/Unresolved registry dependency "base"/)
  })

  it('skips remote registryDependencies', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    const item = makeItem({
      name: 'github',
      registryDependencies: ['https://acme.com/r/widget.json', 'owner/repo/widget'],
    })
    await writeRegistry(dir, [item])

    const report = await validateRegistry({ dir })

    expect(report.valid).toBe(true)
  })

  it('resolves local registryDependencies that exist', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    const base = makeItem({ name: 'base' })
    const item = makeItem({ name: 'github', registryDependencies: ['base', '@getdashfy/base'] })
    await writeRegistry(dir, [base, item])

    const report = await validateRegistry({ dir })

    expect(report.valid).toBe(true)
  })

  it('validates an optional discovery file', async () => {
    const dir = await tmp()
    cleanups.push(dir)
    await writeRegistry(dir, [makeItem()])

    const discoveryDir = await tmp()
    cleanups.push(discoveryDir)

    const goodFile = path.join(discoveryDir, 'registries.json')
    await fs.writeJson(goodFile, {
      registries: { '@getdashfy': { url: 'https://registry.dashfy.dev/r/{name}.json' } },
    })
    const good = await validateRegistry({ dir, registriesFile: goodFile })
    expect(good.valid).toBe(true)

    const badFile = path.join(discoveryDir, 'bad-registries.json')
    await fs.writeJson(badFile, { registries: { dashfy: { url: 'no-placeholder' } } })
    const bad = await validateRegistry({ dir, registriesFile: badFile })
    expect(bad.valid).toBe(false)
    expect(bad.diagnostics.some((d) => d.file.includes('bad-registries.json'))).toBe(true)
  })
})
