import { resolveItemAddress } from '@/registry/address'
import { buildUrlAndHeadersForRegistryItem, resolveRegistryIndexUrl } from '@/registry/builder'
import { BUILTIN_REGISTRY_NAMESPACE } from '@/registry/constants'
import { setRegistryHeaders } from '@/registry/context'
import { RegistryParseError } from '@/registry/errors'
import { fetchRemoteJson, readLocalJson } from '@/registry/fetcher'
import { fetchGitHubRegistryItem } from '@/registry/github'
import { isUrl } from '@/registry/utils'
import type { RegistryConfig, RegistryIndex, RegistryItem } from '@/schema'
import { registryIndexSchema, registryItemSchema } from '@/schema'

export interface RegistryRequestOptions {
  registries: RegistryConfig
  useCache?: boolean
}

/** Fetches and validates a single registry item from any supported address. */
export async function getRegistryItem(
  address: string,
  options: RegistryRequestOptions,
): Promise<RegistryItem> {
  const resolved = resolveItemAddress(address)
  let raw: unknown

  switch (resolved.scheme) {
    case 'url':
      raw = await fetchRemoteJson(resolved.url, options.useCache)
      break
    case 'file':
      raw = await readLocalJson(resolved.path)
      break
    case 'github':
      raw = await fetchGitHubRegistryItem(resolved, options.useCache)
      break
    case 'namespace': {
      const { url, headers } = buildUrlAndHeadersForRegistryItem(address, options.registries)
      if (isUrl(url)) {
        if (Object.keys(headers).length > 0) {
          setRegistryHeaders({ [url]: headers })
        }
        raw = await fetchRemoteJson(url, options.useCache)
      } else {
        raw = await readLocalJson(url)
      }
      break
    }
  }

  const parsed = registryItemSchema.safeParse(raw)
  if (!parsed.success) {
    throw new RegistryParseError(address, parsed.error)
  }
  return parsed.data
}

/** Fetches multiple registry items in parallel (no dependency resolution). */
export function getRegistryItems(
  addresses: string[],
  options: RegistryRequestOptions,
): Promise<RegistryItem[]> {
  return Promise.all(addresses.map((address) => getRegistryItem(address, options)))
}

/** Fetches and validates the registry index/catalog document for a namespace. */
export async function getRegistryIndex(
  options: RegistryRequestOptions,
  namespace = BUILTIN_REGISTRY_NAMESPACE,
): Promise<RegistryIndex> {
  const { url, headers } = resolveRegistryIndexUrl(options.registries, namespace)
  let raw: unknown
  if (isUrl(url)) {
    if (Object.keys(headers).length > 0) {
      setRegistryHeaders({ [url]: headers })
    }
    raw = await fetchRemoteJson(url, options.useCache)
  } else {
    raw = await readLocalJson(url)
  }

  const parsed = registryIndexSchema.safeParse(raw)
  if (!parsed.success) {
    throw new RegistryParseError('index', parsed.error, { subject: 'registry index' })
  }
  return parsed.data
}
