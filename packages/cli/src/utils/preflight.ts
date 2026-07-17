import fs from 'fs-extra'
import path from 'path'

import {
  APP_CANDIDATES,
  CONFIG_CANDIDATES,
  DEFAULT_APP_PATH,
  DEFAULT_ENV_PATH,
  SERVER_CANDIDATES,
} from '@/constants/paths'
import { getConfig } from '@/utils/get-config'

export interface DashfyProject {
  /** Project root (directory containing package.json). */
  cwd: string
  /** File where widgets are registered via WidgetRegistry.addExtension (e.g. src/App.tsx). */
  appFile: string
  /** Server bootstrap file where APIs are registered (e.g. dashfy.server.ts), if present. */
  serverFile?: string
  /** Dashboard config file (dashfy.config.yml|yaml|json), if present. */
  configFile?: string
  /** Environment file path (.env); may not yet exist. */
  envFile: string
}

const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git', '.turbo', 'build'])

/**
 * Inspects `cwd` and resolves the key files the CLI needs to set up an extension.
 * Throws if the directory is not a Dashfy project.
 */
export async function preflight(cwd: string): Promise<DashfyProject> {
  if (!(await fs.pathExists(path.join(cwd, 'package.json')))) {
    throw new Error(
      `No package.json found in ${cwd}. Run this command inside a Dashfy project, or scaffold one with "dashfy init".`,
    )
  }

  // dashfy.json paths take precedence over heuristic discovery.
  const paths = (await getConfig(cwd))?.paths ?? {}

  const appFile =
    (await resolveConfiguredPath(cwd, paths.app)) ??
    (await resolveCandidate(cwd, APP_CANDIDATES)) ??
    (await findFileByContent(cwd, ['.tsx'], 'WidgetRegistry'))

  if (!appFile) {
    throw new Error(
      `Could not find an app file that registers widgets (expected ${DEFAULT_APP_PATH} with WidgetRegistry).`,
    )
  }

  const serverFile =
    (await resolveConfiguredPath(cwd, paths.server)) ??
    (await resolveCandidate(cwd, SERVER_CANDIDATES)) ??
    (await findFileByContent(cwd, ['.ts'], 'new Dashfy('))

  const configFile =
    (await resolveConfiguredPath(cwd, paths.config)) ??
    (await resolveCandidate(cwd, CONFIG_CANDIDATES))

  return {
    cwd,
    appFile,
    serverFile,
    configFile,
    envFile: path.join(cwd, paths.env ?? DEFAULT_ENV_PATH),
  }
}

async function resolveConfiguredPath(
  cwd: string,
  relativePath: string | undefined,
): Promise<string | undefined> {
  if (!relativePath) {
    return undefined
  }
  const full = path.resolve(cwd, relativePath)
  return (await fs.pathExists(full)) ? full : undefined
}

async function resolveCandidate(cwd: string, candidates: string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    const full = path.join(cwd, candidate)
    if (await fs.pathExists(full)) {
      return full
    }
  }
  return undefined
}

async function findFileByContent(
  cwd: string,
  extensions: string[],
  marker: string,
  depth = 4,
): Promise<string | undefined> {
  if (depth < 0) {
    return undefined
  }

  let entries: fs.Dirent[]
  try {
    entries = await fs.readdir(cwd, { withFileTypes: true })
  } catch {
    return undefined
  }

  for (const entry of entries) {
    const full = path.join(cwd, entry.name)
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        continue
      }
      const found = await findFileByContent(full, extensions, marker, depth - 1)
      if (found) {
        return found
      }
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      const content = await fs.readFile(full, 'utf-8')
      if (content.includes(marker)) {
        return full
      }
    }
  }

  return undefined
}
