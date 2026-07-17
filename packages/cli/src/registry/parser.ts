// Valid registry name pattern: @namespace where namespace is alphanumeric with
// hyphens/underscores, followed by /item.
const REGISTRY_PATTERN = /^(@[a-zA-Z0-9](?:[a-zA-Z0-9-_]*[a-zA-Z0-9])?)\/(.+)$/

export interface ParsedRegistryItem {
  registry: string | null
  item: string
}

/**
 * Splits an `@namespace/item` address into its registry and item parts. Returns
 * `{ registry: null, item }` for bare names and non-namespace addresses.
 */
export function parseRegistryAndItemFromString(name: string): ParsedRegistryItem {
  if (!name.startsWith('@')) {
    return { registry: null, item: name }
  }

  const match = REGISTRY_PATTERN.exec(name)
  if (match?.[1] && match[2]) {
    return { registry: match[1], item: match[2] }
  }

  return { registry: null, item: name }
}
