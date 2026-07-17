import { existsSync } from 'node:fs'

import path from 'path'

import { logger } from '@/utils/logger'

/**
 * Env files loaded in precedence order (first match wins). Mirrors the common
 * Vite/Next convention so `${ENV_VAR}` placeholders in `dashfy.json` registries
 * resolve from a project's local `.env` files during `add` / `init`.
 */
const ENV_FILES = ['.env.local', '.env.development.local', '.env.development', '.env'] as const

/**
 * Loads environment variables from the project's `.env` files into
 * `process.env` without overriding values already present in the environment.
 * Failures are non-fatal: a missing or malformed file only logs a warning.
 */
export async function loadEnvFiles(cwd: string = process.cwd()): Promise<void> {
  try {
    const { config } = await import('dotenv')
    for (const file of ENV_FILES) {
      const envPath = path.join(cwd, file)
      if (existsSync(envPath)) {
        config({ path: envPath, override: false, quiet: true })
      }
    }
  } catch (error) {
    logger.warn(
      `Failed to load environment files: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
