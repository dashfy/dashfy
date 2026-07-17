import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import path from 'path'

import { buildRegistryFromPackages } from '@/commands/registry/build'
import { getRegistryItem } from '@/registry/api'
import { BUILTIN_REGISTRY_NAMESPACE } from '@/registry/constants'
import { clearRegistryCache } from '@/registry/fetcher'
import type { RegistryConfig, RegistryItem } from '@/schema'

const PACKAGES_DIR = fileURLToPath(new URL('../../../', import.meta.url))

/**
 * Builds the registry from the repo's `ext-*` packages into a temp directory and
 * returns it. Used by tests as a local `DASHFY_REGISTRY_URL`-style source.
 */
export async function buildLocalRegistry(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-registry-'))
  await buildRegistryFromPackages({ packagesDir: PACKAGES_DIR, outputDir: dir })
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
