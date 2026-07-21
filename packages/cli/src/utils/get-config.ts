import fs from 'fs-extra'
import path from 'path'

import { CONFIG_SCHEMA_URL } from '@/constants/site'
import { withBuiltinRegistries } from '@/registry/builder'
import { ConfigParseError } from '@/registry/errors'
import type { DashfyConfig, RegistryConfig } from '@/schema'
import { dashfyConfigSchema } from '@/schema'

export const CONFIG_FILE = 'dashfy.json'

export interface ResolvedConfig extends DashfyConfig {
  /** Registries merged with the built-ins (`@getdashfy` always present). */
  registries: RegistryConfig
  /** Only the registries declared by the user in dashfy.json (no built-ins). */
  userRegistries?: RegistryConfig
}

/** Reads and validates `dashfy.json` from a project, if present. */
export async function getConfig(cwd: string): Promise<DashfyConfig | null> {
  const configPath = path.join(cwd, CONFIG_FILE)
  if (!(await fs.pathExists(configPath))) {
    return null
  }

  let json: unknown
  try {
    json = JSON.parse(await fs.readFile(configPath, 'utf-8'))
  } catch (error) {
    throw new ConfigParseError(cwd, error)
  }

  const parsed = dashfyConfigSchema.safeParse(json)
  if (!parsed.success) {
    throw new ConfigParseError(cwd, parsed.error)
  }
  return parsed.data
}

/**
 * Returns the project config with built-in registries merged in. Works even
 * when no `dashfy.json` exists (returns just the built-ins).
 */
export async function resolveConfig(cwd: string): Promise<ResolvedConfig> {
  const config = (await getConfig(cwd)) ?? {}
  return {
    ...config,
    userRegistries: config.registries,
    registries: withBuiltinRegistries(config.registries),
  }
}

/** Writes a `dashfy.json` to the project (used when scaffolding). */
export async function writeConfig(cwd: string, config: DashfyConfig): Promise<void> {
  const configPath = path.join(cwd, CONFIG_FILE)
  const payload: DashfyConfig = { $schema: CONFIG_SCHEMA_URL, ...config }
  await fs.writeJson(configPath, payload, { spaces: 2 })
}

/**
 * Merges the given registries into the project's `dashfy.json` (creating the
 * file if needed), preserving existing user registries and other config. Only
 * user-declared registries are persisted; built-ins stay implicit.
 */
export async function addRegistries(cwd: string, entries: RegistryConfig): Promise<void> {
  const config = (await getConfig(cwd)) ?? {}
  const registries: RegistryConfig = { ...config.registries, ...entries }
  await writeConfig(cwd, { ...config, registries })
}

/**
 * Removes the given namespaces from the project's `dashfy.json`. Returns which
 * were removed vs. not present. Drops the `registries` key entirely when it
 * becomes empty, so built-in registries stay implicit.
 */
export async function removeRegistries(
  cwd: string,
  namespaces: string[],
): Promise<{ removed: string[]; missing: string[] }> {
  const config = (await getConfig(cwd)) ?? {}
  const current: RegistryConfig = { ...config.registries }
  const removed: string[] = []
  const missing: string[] = []

  for (const namespace of namespaces) {
    if (namespace in current) {
      delete current[namespace]
      removed.push(namespace)
    } else {
      missing.push(namespace)
    }
  }

  if (removed.length > 0) {
    const next: DashfyConfig = { ...config }
    if (Object.keys(current).length > 0) {
      next.registries = current
    } else {
      delete next.registries
    }
    await writeConfig(cwd, next)
  }

  return { removed, missing }
}
