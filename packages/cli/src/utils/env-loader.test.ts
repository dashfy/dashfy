import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'

import { loadEnvFiles } from '@/utils/env-loader'

const KEY = 'DASHFY_ENV_TEST_KEY'
const ONLY_BASE = 'DASHFY_ENV_TEST_ONLY_BASE'
const PRESET = 'DASHFY_ENV_TEST_PRESET'

async function tmp(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-env-'))
}

afterEach(() => {
  delete process.env[KEY]
  delete process.env[ONLY_BASE]
  delete process.env[PRESET]
})

describe('loadEnvFiles', () => {
  it('loads values from .env into process.env', async () => {
    const cwd = await tmp()
    await fs.writeFile(path.join(cwd, '.env'), `${ONLY_BASE}=base\n`)
    await loadEnvFiles(cwd)
    expect(process.env[ONLY_BASE]).toBe('base')
  })

  it('gives precedence to .env.local over .env', async () => {
    const cwd = await tmp()
    await fs.writeFile(path.join(cwd, '.env'), `${KEY}=from-base\n`)
    await fs.writeFile(path.join(cwd, '.env.local'), `${KEY}=from-local\n`)
    await loadEnvFiles(cwd)
    expect(process.env[KEY]).toBe('from-local')
  })

  it('does not override variables already set in the environment', async () => {
    const cwd = await tmp()
    process.env[PRESET] = 'preset'
    await fs.writeFile(path.join(cwd, '.env'), `${PRESET}=from-file\n`)
    await loadEnvFiles(cwd)
    expect(process.env[PRESET]).toBe('preset')
  })

  it('is a no-op when no env files exist', async () => {
    const cwd = await tmp()
    await expect(loadEnvFiles(cwd)).resolves.toBeUndefined()
  })
})
