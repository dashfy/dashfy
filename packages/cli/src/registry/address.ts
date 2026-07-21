import { BUILTIN_REGISTRY_NAMESPACE } from '@/registry/constants'
import { RegistryValidationError } from '@/registry/errors'
import { parseRegistryAndItemFromString } from '@/registry/parser'
import { isLocalFile, isUrl } from '@/registry/utils'

const GITHUB_OWNER_PATTERN = /^(?!.*--)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/
const GITHUB_REPO_PATTERN = /^[a-zA-Z0-9._-]+$/
const INVALID_GITHUB_REPO_NAMES = new Set(['.', '..'])
// eslint-disable-next-line no-control-regex -- intentionally matches control chars in a ref.
const CONTROL_CHARACTER_PATTERN = /[\x00-\x1f\x7f]/
const WHITESPACE_PATTERN = /\s/

export type ResolvedItemAddress =
  | { scheme: 'namespace'; namespace: string; item: string }
  | { scheme: 'url'; url: string }
  | { scheme: 'file'; path: string }
  | { scheme: 'github'; owner: string; repo: string; item: string; ref?: string }

/**
 * Classifies an `add`/`init` address into a resolvable shape: a URL, a local
 * `.json` file, an `@namespace/item`, or a `owner/repo/item#ref` GitHub source.
 * Bare names (e.g. `github`) resolve to the default `@getdashfy` namespace.
 */
export function resolveItemAddress(address: string): ResolvedItemAddress {
  if (isUrl(address)) {
    return { scheme: 'url', url: address }
  }

  if (isLocalFile(address)) {
    return { scheme: 'file', path: address }
  }

  const { registry, item } = parseRegistryAndItemFromString(address)
  if (registry) {
    return { scheme: 'namespace', namespace: registry, item }
  }

  const github = resolveGitHubItemAddress(address)
  if (github) {
    return github
  }

  // Bare name -> default @getdashfy namespace.
  return { scheme: 'namespace', namespace: BUILTIN_REGISTRY_NAMESPACE, item: address }
}

export function isGitHubItemAddress(address: string): boolean {
  return resolveItemAddress(address).scheme === 'github'
}

function resolveGitHubItemAddress(
  address: string,
): Extract<ResolvedItemAddress, { scheme: 'github' }> | null {
  const hashIndex = address.indexOf('#')
  const source = hashIndex === -1 ? address : address.slice(0, hashIndex)
  const ref = hashIndex === -1 ? undefined : address.slice(hashIndex + 1)
  const parts = source.split('/')

  if (parts.length < 3) {
    return null
  }

  const [owner, repo, ...itemParts] = parts
  if (!owner || !repo || !isGitHubOwner(owner) || !isGitHubRepo(repo)) {
    return null
  }

  const item = itemParts.join('/')
  if (!item) {
    return null
  }

  if (ref !== undefined && !isValidGitHubRef(ref)) {
    throw new RegistryValidationError(`Invalid GitHub ref in item address "${address}".`, {
      suggestion: 'Use a branch, tag, or commit SHA without whitespace or leading dashes.',
    })
  }

  return { scheme: 'github', owner, repo, item, ref }
}

function isGitHubOwner(owner: string): boolean {
  return GITHUB_OWNER_PATTERN.test(owner)
}

function isGitHubRepo(repo: string): boolean {
  return GITHUB_REPO_PATTERN.test(repo) && !INVALID_GITHUB_REPO_NAMES.has(repo)
}

function isValidGitHubRef(ref: string): boolean {
  return (
    !!ref &&
    !CONTROL_CHARACTER_PATTERN.test(ref) &&
    !WHITESPACE_PATTERN.test(ref) &&
    !ref.startsWith('-')
  )
}
