import prompts from 'prompts'

import { fetchRegistriesIndex } from '@/registry/discovery'
import { collectNamespaces } from '@/registry/namespaces'
import type { RegistryConfig } from '@/schema'
import type { ResolvedConfig } from '@/utils/get-config'
import { addRegistries, resolveConfig } from '@/utils/get-config'
import { logger } from '@/utils/logger'

export interface EnsureRegistriesOptions {
  cwd: string
  /** When true, prompt (unless `yes`) and write resolved namespaces to dashfy.json. */
  persist: boolean
  yes?: boolean
  silent?: boolean
}

export interface EnsureRegistriesResult {
  /** Registries to use for resolution (merged with any newly resolved ones). */
  registries: RegistryConfig
  /** Namespaces that were newly resolved (and persisted when `persist`). */
  added: string[]
}

/**
 * Ensures every namespace referenced by `addresses` is resolvable. Unknown
 * namespaces are looked up in the hosted discovery index. When `persist` is set
 * they are written to dashfy.json (with confirmation unless `yes`); otherwise
 * they are merged into the returned registries in memory only. Namespaces
 * missing from the discovery index throw a helpful error.
 */
export async function ensureRegistries(
  addresses: string[],
  config: ResolvedConfig,
  options: EnsureRegistriesOptions,
): Promise<EnsureRegistriesResult> {
  const unknown = collectNamespaces(addresses).filter((namespace) => !config.registries[namespace])
  if (unknown.length === 0) {
    return { registries: config.registries, added: [] }
  }

  const index = await fetchRegistriesIndex().catch(() => undefined)

  const resolved: Record<string, string> = {}
  const unresolved: string[] = []
  for (const namespace of unknown) {
    const url = index?.registries[namespace]?.url
    if (url) {
      resolved[namespace] = url
    } else {
      unresolved.push(namespace)
    }
  }

  if (unresolved.length > 0) {
    throw new Error(
      `Unknown registry namespace(s): ${unresolved.join(', ')}.\n` +
        `Add them to dashfy.json under "registries", e.g.\n` +
        `  { "registries": { "${unresolved[0]}": "https://example.com/r/{name}.json" } }`,
    )
  }

  const namespaces = Object.keys(resolved)

  if (!options.persist) {
    return { registries: { ...config.registries, ...resolved }, added: namespaces }
  }

  if (!options.yes) {
    const response = (await prompts({
      type: 'confirm',
      name: 'add',
      message: `Add ${namespaces.join(', ')} to dashfy.json?`,
      initial: true,
    })) as { add?: boolean }
    if (!response.add) {
      throw new Error(
        `Cannot add extensions from unconfigured registr${
          namespaces.length === 1 ? 'y' : 'ies'
        }: ${namespaces.join(', ')}.`,
      )
    }
  }

  await addRegistries(options.cwd, resolved)
  if (!options.silent) {
    logger.info(`Added ${namespaces.join(', ')} to dashfy.json.`)
  }

  const refreshed = await resolveConfig(options.cwd)
  return { registries: refreshed.registries, added: namespaces }
}
