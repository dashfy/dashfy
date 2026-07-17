import { describe, expect, it } from 'vitest'

import { BUILTIN_REGISTRY_NAMESPACE } from '@/registry/constants'
import type { SearchResults } from '@/registry/search'
import type { RegistryItem } from '@/schema'

import {
  buildExtensionDocs,
  formatAddCommands,
  formatExtensionDocs,
  formatRegistryItems,
  formatRegistryNames,
  formatSearchResults,
  itemAddress,
} from './format'

function makeItem(overrides: Partial<RegistryItem> = {}): RegistryItem {
  return {
    name: 'github',
    type: 'registry:extension',
    title: 'GitHub',
    description: 'GitHub widgets',
    dependencies: ['@dashfy/ext-github@^0.1.0'],
    envVars: ['GITHUB_TOKEN'],
    categories: ['developer'],
    docs: 'Create a token at github.com/settings/tokens',
    meta: {
      extensionKey: 'github',
      widgets: ['RepoBadge', 'PullRequests'],
      client: {
        import: '@dashfy/ext-github',
        factory: 'createGitHubClient',
        mode: 'poll',
      },
    },
    ...overrides,
  }
}

describe('itemAddress', () => {
  it('prefixes bare names with @dashfy', () => {
    expect(itemAddress({ name: 'github' })).toBe(`${BUILTIN_REGISTRY_NAMESPACE}/github`)
  })

  it('keeps namespaced names as-is', () => {
    expect(itemAddress({ name: '@acme/widget' })).toBe('@acme/widget')
  })
})

describe('formatRegistryNames', () => {
  it('lists configured registries', () => {
    const text = formatRegistryNames({ '@dashfy': 'https://r/{name}.json' })
    expect(text).toContain('@dashfy -> https://r/{name}.json')
  })

  it('handles object form registries', () => {
    const text = formatRegistryNames({ '@acme': { url: 'https://acme/{name}.json' } })
    expect(text).toContain('@acme -> https://acme/{name}.json')
  })
})

describe('formatSearchResults', () => {
  it('groups items by registry with counts and inline add commands', () => {
    const results: SearchResults = {
      results: [
        {
          registry: '@dashfy',
          items: [
            { name: 'github', type: 'registry:extension', title: 'GitHub', description: 'GH' },
          ],
          total: 1,
        },
      ],
    }
    const text = formatSearchResults(results, { query: 'git' })
    expect(text).toContain('Found 1 item')
    expect(text).toContain('@dashfy/github (GitHub)')
    expect(text).toContain('Add: dashfy add @dashfy/github')
  })

  it('prefixes the inline add command with the package runner', () => {
    const results: SearchResults = {
      results: [
        {
          registry: '@dashfy',
          items: [
            { name: 'github', type: 'registry:extension', title: 'GitHub', description: 'GH' },
          ],
          total: 1,
        },
      ],
    }
    const text = formatSearchResults(results, { query: 'git', command: 'pnpm dlx dashfy@latest' })
    expect(text).toContain('Add: pnpm dlx dashfy@latest add @dashfy/github')
  })

  it('shows a pagination hint when more items remain', () => {
    const results: SearchResults = {
      results: [
        {
          registry: '@dashfy',
          items: [
            { name: 'github', type: 'registry:extension', title: 'GitHub', description: 'GH' },
          ],
          total: 5,
        },
      ],
    }
    const text = formatSearchResults(results, { query: 'git', offset: 0 })
    expect(text).toContain('4 more in @dashfy — use offset: 1')
  })

  it('reports no items and skipped registries', () => {
    const results: SearchResults = {
      results: [],
      errors: [{ registry: '@broken', message: 'boom' }],
    }
    const text = formatSearchResults(results, { query: 'x' })
    expect(text).toContain('No items found for "x".')
    expect(text).toContain('@broken: boom')
  })
})

describe('formatRegistryItems', () => {
  it('renders item details including setup metadata', () => {
    const text = formatRegistryItems([makeItem()])
    expect(text).toContain('# @dashfy/github')
    expect(text).toContain('Dependencies: @dashfy/ext-github@^0.1.0')
    expect(text).toContain('Environment variables: GITHUB_TOKEN')
    expect(text).toContain('Widgets: RepoBadge, PullRequests')
    expect(text).toContain('Server client: createGitHubClient from @dashfy/ext-github (poll)')
  })

  it('handles empty input', () => {
    expect(formatRegistryItems([])).toBe('No items found.')
  })
})

describe('formatAddCommands', () => {
  it('returns add command and variants', () => {
    const text = formatAddCommands([makeItem(), makeItem({ name: '@acme/widget' })])
    expect(text).toContain('dashfy add @dashfy/github @acme/widget')
    expect(text).toContain('--dry-run')
    expect(text).toContain('--no-install')
  })

  it('prefixes the command and variants with the package runner', () => {
    const text = formatAddCommands([makeItem()], { command: 'bunx dashfy@latest' })
    expect(text).toContain('bunx dashfy@latest add @dashfy/github')
    expect(text).toContain('bunx dashfy@latest add @dashfy/github --dry-run')
    expect(text).toContain('bunx dashfy@latest add @dashfy/github --no-install')
  })
})

describe('buildExtensionDocs', () => {
  it('includes setup, env, integration, starter, and add command', () => {
    const item = makeItem({
      docs: 'Create a token at github.com/settings/tokens',
      meta: {
        extensionKey: 'github',
        widgets: ['RepoBadge', 'Status'],
        client: {
          import: '@dashfy/ext-github',
          factory: 'createGitHubClient',
          mode: 'poll',
          options: '{ token: process.env.GITHUB_TOKEN! }',
        },
        starter: [{ widget: 'RepoBadge', repository: 'facebook/react' }, { widget: 'Status' }],
      },
    })

    const docs = buildExtensionDocs(item)

    expect(docs.address).toBe('@dashfy/github')
    expect(docs.setup).toBe('Create a token at github.com/settings/tokens')
    expect(docs.envVars).toEqual(['GITHUB_TOKEN'])
    expect(docs.integration.extensionKey).toBe('github')
    expect(docs.integration.client?.options).toBe('{ token: process.env.GITHUB_TOKEN! }')
    expect(docs.starter).toHaveLength(2)
    expect(docs.addCommand).toBe('dashfy add @dashfy/github')
  })

  it('omits setup when docs is absent', () => {
    const item = makeItem({ docs: undefined })
    const docs = buildExtensionDocs(item)
    expect(docs.setup).toBeUndefined()
  })

  it('prefixes the add command with the package runner', () => {
    const docs = buildExtensionDocs(makeItem(), { command: 'pnpm dlx dashfy@latest' })
    expect(docs.addCommand).toBe('pnpm dlx dashfy@latest add @dashfy/github')
  })

  it('omits client for frontend-only extensions', () => {
    const item = makeItem({
      envVars: undefined,
      meta: { extensionKey: 'market-live', widgets: ['PriceLive'] },
    })
    const docs = buildExtensionDocs(item)
    expect(docs.integration.client).toBeUndefined()
    expect(docs.envVars).toBeUndefined()
  })
})

describe('formatExtensionDocs', () => {
  it('renders section headers and omits empty sections', () => {
    const item = makeItem({
      meta: {
        extensionKey: 'github',
        widgets: ['RepoBadge', 'Status'],
        client: {
          import: '@dashfy/ext-github',
          factory: 'createGitHubClient',
          mode: 'poll',
          options: '{ token: process.env.GITHUB_TOKEN! }',
        },
        starter: [{ widget: 'RepoBadge', repository: 'facebook/react' }],
      },
    })

    const text = formatExtensionDocs([item])

    expect(text).toContain('@dashfy/github — GitHub')
    expect(text).toContain('Setup\n  Create a token')
    expect(text).toContain('Environment\n  GITHUB_TOKEN')
    expect(text).toContain('Server: createGitHubClient from @dashfy/ext-github (poll)')
    expect(text).toContain('Options: { token: process.env.GITHUB_TOKEN! }')
    expect(text).toContain('- RepoBadge (repository: facebook/react)')
    expect(text).toContain('Install\n  dashfy add @dashfy/github')
  })

  it('omits setup, environment, and server lines when not applicable', () => {
    const item = makeItem({
      docs: undefined,
      envVars: undefined,
      meta: { extensionKey: 'market-live', widgets: ['PriceLive'] },
    })

    const text = formatExtensionDocs([item])

    expect(text).not.toContain('Setup')
    expect(text).not.toContain('Environment')
    expect(text).not.toContain('Server:')
    expect(text).toContain('Integration')
    expect(text).toContain('Install')
  })

  it('prefixes the install command with the package runner', () => {
    const text = formatExtensionDocs([makeItem()], { command: 'bunx dashfy@latest' })
    expect(text).toContain('Install\n  bunx dashfy@latest add @dashfy/github')
  })

  it('handles empty input', () => {
    expect(formatExtensionDocs([])).toBe('No items found.')
  })
})
