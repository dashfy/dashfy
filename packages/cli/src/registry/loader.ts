import fs from 'fs-extra'
import path from 'path'

import { RegistryItemNotFoundError, RegistryParseError } from '@/registry/errors'
import type { Registry, RegistryItem } from '@/schema'
import { registrySchema } from '@/schema'

/**
 * Loads a local source catalog (an array of registry items). Used by tooling
 * and tests that operate on a built registry on disk rather than over HTTP.
 */
export async function loadRegistry(registryFile: string): Promise<Registry> {
  const resolved = path.resolve(registryFile)
  const content = await fs.readFile(resolved, 'utf-8')
  const parsed = registrySchema.safeParse(JSON.parse(content))
  if (!parsed.success) {
    throw new RegistryParseError(registryFile, parsed.error, { subject: 'registry catalog' })
  }
  return parsed.data
}

/** Loads a single item by name from a local source catalog. */
export async function loadRegistryItem(
  itemName: string,
  registryFile: string,
): Promise<RegistryItem> {
  const registry = await loadRegistry(registryFile)
  const item = registry.find((entry) => entry.name === itemName)
  if (!item) {
    throw new RegistryItemNotFoundError(itemName)
  }
  return item
}
