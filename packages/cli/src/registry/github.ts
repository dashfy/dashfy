import type { ResolvedItemAddress } from '@/registry/address'
import { fetchRemoteJson } from '@/registry/fetcher'

type GitHubItemAddress = Extract<ResolvedItemAddress, { scheme: 'github' }>

const DEFAULT_REF = 'main'

/**
 * Builds the raw URL for a registry item hosted in a GitHub repo. Items are
 * expected under `r/<item>.json`, mirroring the published registry layout, so a
 * third-party extension repo can serve its own registry without extra hosting.
 */
export function buildGitHubRawUrl(address: GitHubItemAddress): string {
  const ref = address.ref ?? DEFAULT_REF
  return `https://raw.githubusercontent.com/${address.owner}/${address.repo}/${ref}/r/${address.item}.json`
}

export function fetchGitHubRegistryItem(
  address: GitHubItemAddress,
  useCache = true,
): Promise<unknown> {
  return fetchRemoteJson(buildGitHubRawUrl(address), useCache)
}
