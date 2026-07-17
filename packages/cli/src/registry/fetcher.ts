import { homedir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'

import { getRegistryHeadersFromContext } from '@/registry/context'
import {
  RegistryFetchError,
  RegistryForbiddenError,
  RegistryLocalFileError,
  RegistryNotFoundError,
  RegistryUnauthorizedError,
} from '@/registry/errors'
import { fetchWithProxy } from '@/registry/proxy'

const cache = new Map<string, Promise<unknown>>()

export function clearRegistryCache(): void {
  cache.clear()
}

/** Fetches and JSON-parses a remote registry document, with optional caching. */
export async function fetchRemoteJson(url: string, useCache = true): Promise<unknown> {
  if (useCache && cache.has(url)) {
    return cache.get(url)
  }

  const promise = (async () => {
    const headers = new Headers({
      Accept: 'application/json',
      'User-Agent': 'dashfy',
    })
    for (const [key, value] of Object.entries(getRegistryHeadersFromContext(url))) {
      headers.set(key, value)
    }

    const response = await fetchWithProxy(url, { headers })

    if (!response.ok) {
      if (response.status === 401) {
        throw new RegistryUnauthorizedError(url)
      }
      if (response.status === 403) {
        throw new RegistryForbiddenError(url)
      }
      if (response.status === 404) {
        throw new RegistryNotFoundError(url)
      }
      throw new RegistryFetchError(url, response.status)
    }

    return response.json()
  })()

  if (useCache) {
    cache.set(url, promise)
  }
  return promise
}

/** Reads and JSON-parses a local registry document. */
export async function readLocalJson(filePath: string): Promise<unknown> {
  let expanded = filePath
  if (filePath.startsWith('~/')) {
    expanded = path.join(homedir(), filePath.slice(2))
  }

  const resolved = path.resolve(expanded)
  try {
    const content = await fs.readFile(resolved, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    throw new RegistryLocalFileError(filePath, error)
  }
}
