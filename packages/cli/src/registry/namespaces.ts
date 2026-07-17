import { BUILTIN_REGISTRIES } from '@/registry/constants'
import { parseRegistryAndItemFromString } from '@/registry/parser'

/**
 * Collects the non-built-in `@namespace`s referenced by the given addresses, so
 * the CLI can verify they are configured in dashfy.json before resolving.
 */
export function collectNamespaces(addresses: string[]): string[] {
  const namespaces = new Set<string>()
  for (const address of addresses) {
    const { registry } = parseRegistryAndItemFromString(address)
    if (registry && !BUILTIN_REGISTRIES[registry]) {
      namespaces.add(registry)
    }
  }
  return Array.from(namespaces)
}
