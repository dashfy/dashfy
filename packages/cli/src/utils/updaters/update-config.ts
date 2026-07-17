import fs from 'fs-extra'
import path from 'path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

import { CONFIG_CANDIDATES } from '@/constants/paths'
import type { ExtensionStarterWidget } from '@/schema'
import type { RemoveResult, UpdateResult } from '@/utils/updaters/update-app'

export interface UpdateConfigOptions {
  /** Path to dashfy.config.(yml|yaml|json). */
  configFile: string
  /** Dashboard title to create (e.g. "GitHub"). */
  title: string
  /** Extension id used for the widgets' `extension` field. */
  extensionKey: string
  /** Starter widgets to add (each becomes one grid cell). */
  starter?: ExtensionStarterWidget[]
}

interface DashboardLike {
  title?: string
  columns: number
  rows: number
  widgets: Record<string, unknown>[]
}

interface ConfigLike {
  dashboards?: DashboardLike[]
  [key: string]: unknown
}

/**
 * Appends a starter dashboard for the extension to the config file. Idempotent:
 * skips if a dashboard with the same title already exists, or if there are no
 * starter widgets to add.
 */
export async function updateConfig(options: UpdateConfigOptions): Promise<UpdateResult> {
  const { configFile, title, extensionKey, starter } = options

  if (!starter || starter.length === 0) {
    return 'skipped'
  }

  const isJson = configFile.toLowerCase().endsWith('.json')
  const raw = await fs.readFile(configFile, 'utf-8')
  const config = (isJson ? JSON.parse(raw) : parseYaml(raw)) as ConfigLike

  const dashboards = Array.isArray(config.dashboards) ? config.dashboards : []

  if (dashboards.some((dashboard) => dashboard.title === title)) {
    return 'skipped'
  }

  const widgets = starter.map((entry, index) => {
    const { widget, ...rest } = entry
    return {
      extension: extensionKey,
      widget,
      x: index,
      y: 0,
      columns: 1,
      rows: 1,
      ...rest,
    }
  })

  dashboards.push({
    title,
    columns: Math.max(widgets.length, 1),
    rows: 1,
    widgets,
  })

  config.dashboards = dashboards

  const output = isJson ? `${JSON.stringify(config, null, 2)}\n` : stringifyYaml(config)
  await fs.writeFile(configFile, output, 'utf-8')

  return 'added'
}

export interface RemoveFromConfigOptions {
  /** Path to dashfy.config.(yml|yaml|json). */
  configFile: string
  /** Extension id used as the widgets' `extension` field. */
  extensionKey: string
}

/**
 * Reverses {@link updateConfig}: removes any dashboard whose widgets all belong
 * to this extension (the shape `updateConfig` creates). Dashboards with widgets
 * from other extensions are left untouched. Idempotent: skips if none match.
 */
export async function removeFromConfig(options: RemoveFromConfigOptions): Promise<RemoveResult> {
  const { configFile, extensionKey } = options

  const isJson = configFile.toLowerCase().endsWith('.json')
  const raw = await fs.readFile(configFile, 'utf-8')
  const config = (isJson ? JSON.parse(raw) : parseYaml(raw)) as ConfigLike

  const dashboards = Array.isArray(config.dashboards) ? config.dashboards : []

  const remaining = dashboards.filter(
    (dashboard) =>
      !(
        Array.isArray(dashboard.widgets) &&
        dashboard.widgets.length > 0 &&
        dashboard.widgets.every((widget) => widget.extension === extensionKey)
      ),
  )

  if (remaining.length === dashboards.length) {
    return 'skipped'
  }

  config.dashboards = remaining

  const output = isJson ? `${JSON.stringify(config, null, 2)}\n` : stringifyYaml(config)
  await fs.writeFile(configFile, output, 'utf-8')

  return 'removed'
}

/**
 * Resolves the config file path within a project, if one exists.
 */
export async function findConfigFile(cwd: string): Promise<string | undefined> {
  for (const name of CONFIG_CANDIDATES) {
    const full = path.join(cwd, name)
    if (await fs.pathExists(full)) {
      return full
    }
  }
  return undefined
}
