import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import path from 'path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

import { DEFAULT_CONFIG_PATH } from '@/constants/paths'
import { removeFromConfig, updateConfig } from '@/utils/updaters/update-config'

const MINIMAL_CONFIG = `port: 5001
apis:
  pollInterval: 300000
dashboards:
  - title: Dashfy Dashboard
    columns: 1
    rows: 1
    widgets:
      - extension: dashfy
        widget: Inspector
        x: 0
        y: 0
        columns: 1
        rows: 1
`

interface ParsedConfig {
  dashboards: { title?: string; columns: number; widgets: Record<string, unknown>[] }[]
}

async function makeConfigFile(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-config-'))
  const configFile = path.join(dir, DEFAULT_CONFIG_PATH)
  await writeFile(configFile, MINIMAL_CONFIG, 'utf-8')
  return configFile
}

describe('updateConfig', () => {
  it('appends a starter dashboard with positioned widgets', async () => {
    const configFile = await makeConfigFile()

    const result = await updateConfig({
      configFile,
      title: 'GitHub',
      extensionKey: 'github',
      starter: [{ widget: 'RepoBadge', repository: 'facebook/react' }, { widget: 'Status' }],
    })

    const parsed = parseYaml(await readFile(configFile, 'utf-8')) as ParsedConfig

    expect(result).toBe('added')
    expect(parsed.dashboards).toHaveLength(2)

    const dashboard = parsed.dashboards[1]!
    expect(dashboard.title).toBe('GitHub')
    expect(dashboard.columns).toBe(2)
    expect(dashboard.widgets).toHaveLength(2)
    expect(dashboard.widgets[0]).toMatchObject({
      extension: 'github',
      widget: 'RepoBadge',
      x: 0,
      y: 0,
      repository: 'facebook/react',
    })
    expect(dashboard.widgets[1]).toMatchObject({ widget: 'Status', x: 1 })
  })

  it('skips when there are no starter widgets', async () => {
    const configFile = await makeConfigFile()

    const result = await updateConfig({
      configFile,
      title: 'Empty',
      extensionKey: 'empty',
      starter: [],
    })

    expect(result).toBe('skipped')
  })

  it('is idempotent on re-run', async () => {
    const configFile = await makeConfigFile()
    const options = {
      configFile,
      title: 'GitHub',
      extensionKey: 'github',
      starter: [{ widget: 'Status' }],
    }

    await updateConfig(options)
    const first = await readFile(configFile, 'utf-8')

    const second = await updateConfig(options)
    const after = await readFile(configFile, 'utf-8')

    expect(second).toBe('skipped')
    expect(after).toBe(first)
  })
})

describe('removeFromConfig', () => {
  it('removes the dashboard the extension created', async () => {
    const configFile = await makeConfigFile()
    await updateConfig({
      configFile,
      title: 'GitHub',
      extensionKey: 'github',
      starter: [{ widget: 'RepoBadge' }, { widget: 'Status' }],
    })

    const removed = await removeFromConfig({ configFile, extensionKey: 'github' })
    const parsed = parseYaml(await readFile(configFile, 'utf-8')) as ParsedConfig

    expect(removed).toBe('removed')
    expect(parsed.dashboards).toHaveLength(1)
    expect(parsed.dashboards[0]!.title).toBe('Dashfy Dashboard')
  })

  it('skips when no matching dashboard exists', async () => {
    const configFile = await makeConfigFile()

    const removed = await removeFromConfig({ configFile, extensionKey: 'github' })

    expect(removed).toBe('skipped')
  })

  it('leaves dashboards that mix other extensions untouched', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-config-'))
    const configFile = path.join(dir, DEFAULT_CONFIG_PATH)
    const mixed = `dashboards:
  - title: Mixed
    columns: 2
    rows: 1
    widgets:
      - extension: github
        widget: Status
      - extension: nba
        widget: Scores
`
    await writeFile(configFile, mixed, 'utf-8')

    const removed = await removeFromConfig({ configFile, extensionKey: 'github' })
    const parsed = parseYaml(await readFile(configFile, 'utf-8')) as ParsedConfig

    expect(removed).toBe('skipped')
    expect(parsed.dashboards.some((dashboard) => dashboard.title === 'Mixed')).toBe(true)
  })
})
