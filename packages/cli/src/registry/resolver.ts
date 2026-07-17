import { getRegistryItem, type RegistryRequestOptions } from '@/registry/api'
import type { RegistryItem } from '@/schema'

/**
 * Resolves a set of extension addresses into a flat, de-duplicated list of
 * registry items, with `registryDependencies` ordered before the items that
 * depend on them (post-order). Mirrors shadcn's tree resolution, minus file
 * merging since Dashfy items only carry npm + setup metadata.
 */
export async function resolveRegistryItems(
  addresses: string[],
  options: RegistryRequestOptions,
): Promise<RegistryItem[]> {
  const result: RegistryItem[] = []
  const resolvedNames = new Set<string>()
  const visiting = new Set<string>()

  const visit = async (address: string): Promise<void> => {
    if (visiting.has(address)) {
      return
    }
    visiting.add(address)

    const item = await getRegistryItem(address, options)

    for (const dependency of item.registryDependencies ?? []) {
      await visit(dependency)
    }

    if (!resolvedNames.has(item.name)) {
      resolvedNames.add(item.name)
      result.push(item)
    }
  }

  for (const address of addresses) {
    await visit(address)
  }

  return result
}
