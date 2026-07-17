import { REGISTRIES_INDEX_URL } from '@/registry/constants'
import { RegistryParseError } from '@/registry/errors'
import { fetchRemoteJson, readLocalJson } from '@/registry/fetcher'
import { isUrl } from '@/registry/utils'
import type { RegistriesIndex } from '@/schema'
import { registriesIndexSchema } from '@/schema'

/**
 * Resolves the location of the discovery index. Defaults to the hosted file but
 * can be overridden with `DASHFY_REGISTRIES_URL` for offline/dev work. The
 * override may be a full URL/path to a `registries.json` or a directory/base it
 * lives under (the discovery analog of `DASHFY_REGISTRY_URL`).
 *
 * Read lazily (not at import time) so `.env` files loaded by the command can
 * influence it.
 */
export function resolveRegistriesIndexUrl(): string {
  const override = process.env.DASHFY_REGISTRIES_URL
  if (!override) {
    return REGISTRIES_INDEX_URL
  }
  return override.endsWith('.json') ? override : `${override.replace(/\/+$/, '')}/registries.json`
}

/** Fetches and validates the discovery index of known public registries. */
export async function fetchRegistriesIndex(useCache = true): Promise<RegistriesIndex> {
  const source = resolveRegistriesIndexUrl()
  const raw = isUrl(source) ? await fetchRemoteJson(source, useCache) : await readLocalJson(source)

  const parsed = registriesIndexSchema.safeParse(raw)
  if (!parsed.success) {
    throw new RegistryParseError('registries', parsed.error, { subject: 'registries index' })
  }
  return parsed.data
}

/**
 * Looks up the URL template for a namespace in the discovery index. Returns
 * `undefined` when the namespace is not listed.
 */
export async function resolveNamespaceUrl(
  namespace: string,
  useCache = true,
): Promise<string | undefined> {
  const index = await fetchRegistriesIndex(useCache)
  return index.registries[namespace]?.url
}
