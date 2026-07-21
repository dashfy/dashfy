import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildRegistryFromPackages, registryBuild } from '@/commands/registry/build'
import { DASHFY_SITE, REGISTRY_ITEM_SCHEMA_URL } from '@/constants/site'
import { REGISTRY_CATALOG_NAME } from '@/registry/constants'
import type { RegistryIndex, RegistryItem } from '@/schema'

async function tmp(prefix: string): Promise<string> {
  return mkdtemp(path.join(tmpdir(), prefix))
}

let cleanups: string[] = []

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(cleanups.map((dir) => fs.remove(dir).catch(() => undefined)))
  cleanups = []
})

interface WriteExtensionOptions {
  id: string
  title: string
  widgets: string[]
  version?: string
  description?: string
  packageDescription?: string
  docs?: string
  envVars?: string[]
  categories?: string[]
}

/** Writes a minimal ext-* package with dashfy metadata into packagesDir. */
async function writeExtension(
  packagesDir: string,
  folder: string,
  options: WriteExtensionOptions,
): Promise<void> {
  const dir = path.join(packagesDir, folder)
  await fs.ensureDir(dir)
  await fs.writeJson(path.join(dir, 'package.json'), {
    name: `@getdashfy/${folder}`,
    version: options.version ?? '1.2.3',
    description: options.packageDescription,
    dashfy: {
      id: options.id,
      title: options.title,
      description: options.description,
      widgets: options.widgets,
      docs: options.docs,
      envVars: options.envVars,
      categories: options.categories,
    },
  })
}

describe('buildRegistryFromPackages', () => {
  it('writes item documents and index.json from ext-* package metadata', async () => {
    const packagesDir = await tmp('dashfy-registry-build-pkgs-')
    const outputDir = await tmp('dashfy-registry-build-out-')
    cleanups.push(packagesDir, outputDir)

    await writeExtension(packagesDir, 'ext-alpha', {
      id: 'alpha',
      title: 'Alpha',
      widgets: ['AlphaWidget'],
      docs: 'Set up alpha',
      envVars: ['ALPHA_TOKEN'],
      categories: ['demo'],
    })

    const { count } = await buildRegistryFromPackages({ packagesDir, outputDir })

    expect(count).toBe(1)

    const item = (await fs.readJson(path.join(outputDir, 'alpha.json'))) as RegistryItem
    expect(item).toMatchObject({
      $schema: REGISTRY_ITEM_SCHEMA_URL,
      name: 'alpha',
      type: 'registry:extension',
      title: 'Alpha',
      dependencies: ['@getdashfy/ext-alpha@^1.2.3'],
      docs: 'Set up alpha',
      envVars: ['ALPHA_TOKEN'],
      categories: ['demo'],
      meta: {
        extensionKey: 'alpha',
        widgets: ['AlphaWidget'],
      },
    })

    const index = (await fs.readJson(path.join(outputDir, 'index.json'))) as RegistryIndex
    expect(index.name).toBe(REGISTRY_CATALOG_NAME)
    expect(index.homepage).toBe(DASHFY_SITE)
    expect(index.items).toEqual([
      {
        name: 'alpha',
        type: 'registry:extension',
        title: 'Alpha',
        categories: ['demo'],
      },
    ])
  })

  it('falls back to package.json description when dashfy.description is omitted', async () => {
    const packagesDir = await tmp('dashfy-registry-build-pkgs-')
    const outputDir = await tmp('dashfy-registry-build-out-')
    cleanups.push(packagesDir, outputDir)

    await writeExtension(packagesDir, 'ext-beta', {
      id: 'beta',
      title: 'Beta',
      widgets: ['BetaWidget'],
      packageDescription: 'Package-level description',
    })

    await buildRegistryFromPackages({ packagesDir, outputDir })

    const item = (await fs.readJson(path.join(outputDir, 'beta.json'))) as RegistryItem
    expect(item.description).toBe('Package-level description')
  })

  it('sorts items by name in output files and index', async () => {
    const packagesDir = await tmp('dashfy-registry-build-pkgs-')
    const outputDir = await tmp('dashfy-registry-build-out-')
    cleanups.push(packagesDir, outputDir)

    await writeExtension(packagesDir, 'ext-zulu', {
      id: 'zulu',
      title: 'Zulu',
      widgets: ['ZuluWidget'],
    })
    await writeExtension(packagesDir, 'ext-alpha', {
      id: 'alpha',
      title: 'Alpha',
      widgets: ['AlphaWidget'],
    })

    const { count } = await buildRegistryFromPackages({ packagesDir, outputDir })

    expect(count).toBe(2)
    expect(await fs.pathExists(path.join(outputDir, 'alpha.json'))).toBe(true)
    expect(await fs.pathExists(path.join(outputDir, 'zulu.json'))).toBe(true)

    const index = (await fs.readJson(path.join(outputDir, 'index.json'))) as RegistryIndex
    expect(index.items.map((entry) => entry.name)).toEqual(['alpha', 'zulu'])
  })

  it('skips ext-* directories without package.json', async () => {
    const packagesDir = await tmp('dashfy-registry-build-pkgs-')
    const outputDir = await tmp('dashfy-registry-build-out-')
    cleanups.push(packagesDir, outputDir)

    await fs.ensureDir(path.join(packagesDir, 'ext-empty'))
    await writeExtension(packagesDir, 'ext-present', {
      id: 'present',
      title: 'Present',
      widgets: ['PresentWidget'],
    })

    const { count } = await buildRegistryFromPackages({ packagesDir, outputDir })

    expect(count).toBe(1)
    expect(await fs.pathExists(path.join(outputDir, 'present.json'))).toBe(true)
  })

  it('skips ext-* packages without dashfy metadata and warns', async () => {
    const packagesDir = await tmp('dashfy-registry-build-pkgs-')
    const outputDir = await tmp('dashfy-registry-build-out-')
    cleanups.push(packagesDir, outputDir)

    const skippedDir = path.join(packagesDir, 'ext-skipped')
    await fs.ensureDir(skippedDir)
    await fs.writeJson(path.join(skippedDir, 'package.json'), {
      name: '@getdashfy/ext-skipped',
      version: '0.1.0',
    })
    await writeExtension(packagesDir, 'ext-kept', {
      id: 'kept',
      title: 'Kept',
      widgets: ['KeptWidget'],
    })

    const warn = vi.spyOn(console, 'warn')

    const { count } = await buildRegistryFromPackages({ packagesDir, outputDir })

    expect(count).toBe(1)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Skipping @getdashfy/ext-skipped: no "dashfy" metadata field.'),
    )
  })

  it('ignores directories that do not start with ext-', async () => {
    const packagesDir = await tmp('dashfy-registry-build-pkgs-')
    const outputDir = await tmp('dashfy-registry-build-out-')
    cleanups.push(packagesDir, outputDir)

    const otherDir = path.join(packagesDir, 'ui')
    await fs.ensureDir(otherDir)
    await fs.writeJson(path.join(otherDir, 'package.json'), {
      name: '@getdashfy/ui',
      version: '0.1.0',
      dashfy: { id: 'ui', title: 'UI', widgets: ['UiWidget'] },
    })

    const { count } = await buildRegistryFromPackages({ packagesDir, outputDir })

    expect(count).toBe(0)
    expect(await fs.pathExists(path.join(outputDir, 'index.json'))).toBe(true)
    const index = (await fs.readJson(path.join(outputDir, 'index.json'))) as RegistryIndex
    expect(index.items).toEqual([])
  })

  it('throws when dashfy metadata fails schema validation', async () => {
    const packagesDir = await tmp('dashfy-registry-build-pkgs-')
    const outputDir = await tmp('dashfy-registry-build-out-')
    cleanups.push(packagesDir, outputDir)

    const invalidDir = path.join(packagesDir, 'ext-invalid')
    await fs.ensureDir(invalidDir)
    await fs.writeJson(path.join(invalidDir, 'package.json'), {
      name: '@getdashfy/ext-invalid',
      version: '0.1.0',
      dashfy: {
        id: 'invalid',
        title: 'Invalid',
        widgets: [],
      },
    })

    await expect(buildRegistryFromPackages({ packagesDir, outputDir })).rejects.toThrow()
  })
})

describe('registry build command', () => {
  it('writes registry artifacts to a custom output directory', async () => {
    const cwd = await tmp('dashfy-registry-build-cwd-')
    const packagesDir = path.join(cwd, 'packages')
    const outputDir = path.join(cwd, 'out', 'r')
    cleanups.push(cwd)

    await writeExtension(packagesDir, 'ext-cli', {
      id: 'cli',
      title: 'CLI',
      widgets: ['CliWidget'],
    })

    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      logs.push(String(message))
    })

    await registryBuild.parseAsync(['packages', '-c', cwd, '-o', 'out/r'], { from: 'user' })

    expect(await fs.pathExists(path.join(outputDir, 'cli.json'))).toBe(true)
    expect(await fs.pathExists(path.join(outputDir, 'index.json'))).toBe(true)

    const output = logs.join('\n')
    expect(output).toContain('success')
    expect(output).toContain('extension(s)')
    expect(output).toContain('out/r')
  })
})
