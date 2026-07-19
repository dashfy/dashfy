import fs from 'fs-extra'
import path from 'path'

/** The `dashfy` metadata block authored in an extension's package.json. */
interface FixtureExtensionMeta {
  id: string
  title: string
  categories?: string[]
  docs?: string
  widgets: string[]
  client?: {
    import: string
    factory: string
    mode: 'poll' | 'push'
    options?: string
  }
  envVars?: string[]
  starter?: Record<string, unknown>[]
}

/**
 * Self-contained fixtures mirroring the former `@dashfy/ext-*` packages. These
 * back the CLI test registry so the suite no longer depends on real extension
 * packages living in the monorepo. Keep the metadata in sync with the shape the
 * tests assert on (see setup-extension / search / integration tests).
 */
const FIXTURE_EXTENSIONS: FixtureExtensionMeta[] = [
  {
    id: 'github',
    title: 'GitHub',
    categories: ['developer'],
    docs: 'Create a token at https://github.com/settings/tokens',
    widgets: [
      'UserBadge',
      'OrgBadge',
      'RepoBadge',
      'Status',
      'Branches',
      'PullRequests',
      'ContributorsStats',
      'CommitActivityLine',
      'Gitmap',
    ],
    client: {
      import: '@dashfy/ext-github',
      factory: 'createGitHubClient',
      mode: 'poll',
      options: '{ token: process.env.GITHUB_TOKEN! }',
    },
    envVars: ['GITHUB_TOKEN'],
    starter: [{ widget: 'RepoBadge', repository: 'facebook/react' }, { widget: 'Status' }],
  },
  {
    id: 'json',
    title: 'JSON / REST',
    categories: ['data'],
    widgets: ['CustomJson', 'JsonKeys', 'JsonStatus'],
    client: {
      import: '@dashfy/ext-json',
      factory: 'createJsonClient',
      mode: 'poll',
    },
    starter: [
      {
        widget: 'JsonStatus',
        title: 'API Status',
        url: 'https://api.example.com/health',
        statuses: [{ assert: 'equals(status, ok)', status: 'success', label: 'API Online' }],
      },
    ],
  },
  {
    id: 'nba',
    title: 'NBA',
    categories: ['sports'],
    widgets: ['GameCard', 'Scoreboard', 'Standings'],
    client: {
      import: '@dashfy/ext-nba',
      factory: 'createNbaClient',
      mode: 'poll',
    },
    starter: [{ widget: 'Scoreboard' }, { widget: 'Standings', conference: 'East' }],
  },
  {
    id: 'system',
    title: 'System Monitor',
    categories: ['monitoring'],
    widgets: [
      'CpuUsage',
      'CpuUsageGauge',
      'CpuUsageLine',
      'MemoryUsage',
      'MemoryUsageGauge',
      'MemoryUsageLine',
      'DiskUsage',
      'DiskUsageGauge',
      'NetworkStats',
      'NetworkStatsCompact',
      'NetworkStatsLine',
      'Processes',
      'SystemInfo',
    ],
    client: {
      import: '@dashfy/ext-system/client',
      factory: 'createSystemClient',
      mode: 'push',
    },
    starter: [
      { widget: 'CpuUsageGauge' },
      { widget: 'MemoryUsageGauge' },
      { widget: 'DiskUsageGauge' },
    ],
  },
  {
    id: 'market-live',
    title: 'Market Live',
    categories: ['finance'],
    widgets: ['PriceLive', 'TableLive'],
    starter: [{ widget: 'PriceLive', feedId: 'crypto.BTC_USD', showChart: false }],
  },
]

/**
 * Writes minimal `ext-<id>` package.json fixtures (with `dashfy` metadata) into
 * `packagesDir` so `buildRegistryFromPackages` can produce a local test registry
 * without depending on real extension packages.
 */
export async function writeFixtureExtensions(packagesDir: string): Promise<void> {
  for (const meta of FIXTURE_EXTENSIONS) {
    const dir = path.join(packagesDir, `ext-${meta.id}`)
    await fs.ensureDir(dir)
    await fs.writeJson(path.join(dir, 'package.json'), {
      name: `@dashfy/ext-${meta.id}`,
      version: '0.1.0',
      type: 'module',
      dashfy: meta,
    })
  }
}
