import fuzzysort from 'fuzzysort'

import { getRegistryIndex } from '@/registry/api'
import { BUILTIN_REGISTRY_NAMESPACE } from '@/registry/constants'
import type { RegistryConfig, RegistryIndexItem } from '@/schema'
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'

/** Item types that can be filtered with `--type`. Dashfy items are extensions. */
export const SEARCHABLE_TYPES = ['registry:extension'] as const

export interface SearchOptions {
  query?: string
  types?: string[]
  limit?: number
  offset?: number
  registries: RegistryConfig
  /** Collect per-registry failures instead of throwing (used for search-all). */
  continueOnError?: boolean
}

export interface RegistrySearchResult {
  registry: string
  items: RegistryIndexItem[]
  /** Total matching items before offset/limit slicing (for pagination hints). */
  total?: number
}

export interface RegistrySearchError {
  registry: string
  message: string
}

export interface SearchResults {
  results: RegistrySearchResult[]
  errors?: RegistrySearchError[]
}

/** Returns the `--type` values that are not valid searchable item types. */
export function findUnknownTypes(types: string[]): string[] {
  const known = new Set<string>(SEARCHABLE_TYPES)
  return types.filter((type) => !known.has(type))
}

/**
 * Fetches each namespace's catalog index and filters items by item type, then
 * fuzzy-ranks them by query (matched across name/title/description/categories)
 * before applying offset/limit. Each result group reports `total` (matches
 * before slicing) so callers can render pagination hints. Per-registry failures
 * throw unless `continueOnError` is set, in which case they are collected in
 * `errors`.
 */
export async function searchRegistries(
  namespaces: string[],
  options: SearchOptions,
): Promise<SearchResults> {
  const results: RegistrySearchResult[] = []
  const errors: RegistrySearchError[] = []

  const query = options.query?.trim()
  const typeFilter = options.types?.length ? new Set(options.types) : undefined
  const offset = options.offset ?? 0

  for (const namespace of namespaces) {
    try {
      const index = await getRegistryIndex({ registries: options.registries }, namespace)
      let items = index.items
      if (typeFilter) {
        items = items.filter((item) => typeFilter.has(item.type))
      }
      if (query) {
        items = rankByQuery(items, query)
      }
      const total = items.length
      const limit = options.limit ?? total
      results.push({ registry: namespace, items: items.slice(offset, offset + limit), total })
    } catch (error) {
      if (!options.continueOnError) {
        throw error
      }
      errors.push({
        registry: namespace,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return errors.length > 0 ? { results, errors } : { results }
}

/** Fuzzy-ranks items by query across name/title/description/categories. */
function rankByQuery(items: RegistryIndexItem[], query: string): RegistryIndexItem[] {
  const ranked = fuzzysort.go(query, items, {
    keys: [
      (item) => item.name,
      (item) => item.title,
      (item) => item.description ?? '',
      (item) => (item.categories ?? []).join(' '),
    ],
    threshold: -10000,
  })
  return ranked.map((result) => result.obj)
}

/** Returns the install address for an item (`@dashfy/<name>` for bare names). */
function itemAddress(item: RegistryIndexItem): string {
  return item.name.startsWith('@') ? item.name : `${BUILTIN_REGISTRY_NAMESPACE}/${item.name}`
}

/** Pretty-prints search results grouped by registry. */
export function printSearchResults(
  results: SearchResults,
  context: { query?: string; types?: string[]; offset?: number; command?: string },
): void {
  const shown = results.results.reduce((sum, group) => sum + group.items.length, 0)
  const offset = context.offset ?? 0
  const command = context.command ?? 'dashfy'

  if (shown === 0) {
    const suffix = context.query ? ` for "${context.query}"` : ''
    logger.info(`No items found${suffix}.`)
  }

  for (const group of results.results) {
    if (group.items.length === 0) {
      continue
    }
    logger.break()
    logger.log(highlighter.info(group.registry))
    for (const item of group.items) {
      const description = item.description ? ` ${highlighter.dim(`- ${item.description}`)}` : ''
      logger.log(
        `  ${highlighter.bold(item.name)} ${highlighter.dim(`(${item.title})`)}${description}`,
      )
      logger.log(`    ${highlighter.dim(`${command} add ${itemAddress(item)}`)}`)
    }

    const total = group.total ?? group.items.length
    const nextOffset = offset + group.items.length
    if (total > nextOffset) {
      logger.log(highlighter.dim(`  … ${total - nextOffset} more — use --offset ${nextOffset}`))
    }
  }

  if (results.errors && results.errors.length > 0) {
    logger.break()
    for (const failure of results.errors) {
      logger.warn(`${failure.registry}: ${failure.message}`)
    }
  }
}
