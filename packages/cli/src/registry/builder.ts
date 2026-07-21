import {
  BUILTIN_REGISTRIES,
  BUILTIN_REGISTRY_NAMESPACE,
  REGISTRY_INDEX_FILE,
  REGISTRY_URL,
} from '@/registry/constants'
import { expandEnvVars, extractEnvVars } from '@/registry/env'
import {
  RegistryMissingEnvironmentVariablesError,
  RegistryNotConfiguredError,
} from '@/registry/errors'
import { parseRegistryAndItemFromString } from '@/registry/parser'
import type { RegistryConfig, RegistryConfigItem } from '@/schema'

const NAME_PLACEHOLDER = '{name}'

export interface ResolvedRegistryUrl {
  url: string
  headers: Record<string, string>
}

/**
 * Resolves a namespaced item (e.g. `@getdashfy/github`) to a concrete URL or local
 * path plus any auth headers, using the built-in and user-configured registries.
 */
export function buildUrlAndHeadersForRegistryItem(
  name: string,
  registries: RegistryConfig,
): ResolvedRegistryUrl {
  const { registry, item } = parseRegistryAndItemFromString(name)
  const namespace = registry ?? BUILTIN_REGISTRY_NAMESPACE

  const config = registries[namespace]
  if (!config) {
    throw new RegistryNotConfiguredError(namespace)
  }

  return {
    url: buildUrl(item, config, namespace),
    headers: buildHeaders(config, namespace),
  }
}

/** Resolves the URL/path for a registry's index document (defaults to `@getdashfy`). */
export function resolveRegistryIndexUrl(
  registries: RegistryConfig,
  namespace = BUILTIN_REGISTRY_NAMESPACE,
): ResolvedRegistryUrl {
  const config = registries[namespace]
  if (!config) {
    throw new RegistryNotConfiguredError(namespace)
  }
  // Replace {name}.json with the index file to keep a single base definition.
  const indexName = REGISTRY_INDEX_FILE.replace(/\.json$/, '')
  return {
    url: buildUrl(indexName, config, namespace),
    headers: buildHeaders(config, namespace),
  }
}

/** Merges the built-in registries with any user-provided ones. */
export function withBuiltinRegistries(registries?: RegistryConfig): RegistryConfig {
  return { ...BUILTIN_REGISTRIES, ...registries }
}

export { REGISTRY_URL }

function buildUrl(item: string, config: RegistryConfigItem, namespace: string): string {
  const template = typeof config === 'string' ? config : config.url
  assertEnvVars(template, namespace)

  let url = expandEnvVars(template).replace(NAME_PLACEHOLDER, item)

  if (typeof config !== 'string' && config.params) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(config.params)) {
      assertEnvVars(value, namespace)
      params.set(key, expandEnvVars(value))
    }
    const query = params.toString()
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query
    }
  }

  return url
}

function buildHeaders(config: RegistryConfigItem, namespace: string): Record<string, string> {
  if (typeof config === 'string' || !config.headers) {
    return {}
  }

  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(config.headers)) {
    assertEnvVars(value, namespace)
    headers[key] = expandEnvVars(value)
  }
  return headers
}

function assertEnvVars(value: string, namespace: string): void {
  const missing = extractEnvVars(value).filter((name) => !process.env[name])
  if (missing.length > 0) {
    throw new RegistryMissingEnvironmentVariablesError(namespace, missing)
  }
}
