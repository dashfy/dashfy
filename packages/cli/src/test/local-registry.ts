import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import path from 'path'

import { buildRegistryFromPackages } from '@/commands/registry/build'
import { getRegistryItem } from '@/registry/api'
import { BUILTIN_REGISTRY_NAMESPACE } from '@/registry/constants'
import { clearRegistryCache } from '@/registry/fetcher'
import type { RegistryConfig, RegistryItem } from '@/schema'
import { writeFixtureExtensions } from '@/test/fixtures/extensions'

/**
 * Builds the registry from self-contained fixture `ext-*` packages into a temp
 * directory and returns it. Used by tests as a local `DASHFY_REGISTRY_URL`-style
 * source, decoupled from any real extension packages in the monorepo.
 */
export async function buildLocalRegistry(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-registry-'))
  const packagesDir = await mkdtemp(path.join(tmpdir(), 'dashfy-registry-pkgs-'))
  try {
    await writeFixtureExtensions(packagesDir)
    await buildRegistryFromPackages({ packagesDir, outputDir: dir })
  } finally {
    await rm(packagesDir, { recursive: true, force: true })
  }
  clearRegistryCache()
  return dir
}

/** Registry config that points the `@dashfy` namespace at a local directory. */
export function localRegistries(dir: string): RegistryConfig {
  return { [BUILTIN_REGISTRY_NAMESPACE]: `${dir}/{name}.json` }
}

/** Loads a single extension item from a locally built registry. */
export function getLocalExtension(dir: string, name: string): Promise<RegistryItem> {
  return getRegistryItem(name, { registries: localRegistries(dir), useCache: false })
}
