import fs from 'fs-extra'

import type { RemoveResult, UpdateResult } from '@/utils/updaters/update-app'

export interface UpdateEnvOptions {
  /** Path to the .env file (created if missing). */
  envFile: string
  /** Environment variable names to ensure exist. */
  envVars: string[]
}

/**
 * Ensures the given environment variables exist in the .env file (added with
 * empty values if missing). Idempotent: never duplicates existing keys.
 */
export async function updateEnv(options: UpdateEnvOptions): Promise<UpdateResult> {
  const { envFile, envVars } = options

  if (envVars.length === 0) {
    return 'skipped'
  }

  const existing = (await fs.pathExists(envFile)) ? await fs.readFile(envFile, 'utf-8') : ''
  const definedKeys = new Set(
    existing
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => (line.split('=')[0] ?? '').trim()),
  )

  const missing = envVars.filter((name) => !definedKeys.has(name))
  if (missing.length === 0) {
    return 'skipped'
  }

  const prefix = existing.length > 0 && !existing.endsWith('\n') ? '\n' : ''
  const additions = missing.map((name) => `${name}=`).join('\n')
  await fs.writeFile(envFile, `${existing}${prefix}${additions}\n`, 'utf-8')

  return 'added'
}

export interface RemoveFromEnvOptions {
  /** Path to the .env file. */
  envFile: string
  /** Environment variable names to remove if still empty. */
  envVars: string[]
}

export interface RemoveFromEnvResult {
  result: RemoveResult
  /** Vars left untouched because they hold a non-empty value. */
  kept: string[]
}

/**
 * Reverses {@link updateEnv}: removes lines for the extension's env vars only
 * when they are still empty placeholders (e.g. `GITHUB_TOKEN=`). Lines that hold
 * a value are preserved (reported as `kept`) to avoid destroying secrets.
 */
export async function removeFromEnv(options: RemoveFromEnvOptions): Promise<RemoveFromEnvResult> {
  const { envFile, envVars } = options

  if (envVars.length === 0 || !(await fs.pathExists(envFile))) {
    return { result: 'skipped', kept: [] }
  }

  const targets = new Set(envVars)
  const existing = await fs.readFile(envFile, 'utf-8')
  const hadTrailingNewline = existing.endsWith('\n')
  const lines = existing.split('\n')

  const kept: string[] = []
  let removedAny = false
  const linePattern = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/

  const nextLines = lines.filter((line) => {
    const match = linePattern.exec(line)
    const key = match?.[1]
    if (!key || !targets.has(key)) {
      return true
    }
    if ((match[2] ?? '').trim() === '') {
      removedAny = true
      return false
    }
    kept.push(key)
    return true
  })

  if (!removedAny) {
    return { result: 'skipped', kept }
  }

  let output = nextLines.join('\n')
  if (hadTrailingNewline && !output.endsWith('\n')) {
    output += '\n'
  }
  await fs.writeFile(envFile, output, 'utf-8')

  return { result: 'removed', kept }
}
