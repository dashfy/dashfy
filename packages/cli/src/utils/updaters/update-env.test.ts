import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import path from 'path'
import { describe, expect, it } from 'vitest'

import { removeFromEnv, updateEnv } from '@/utils/updaters/update-env'

async function makeDir(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-env-'))
}

describe('updateEnv', () => {
  it('creates the .env file with missing variables', async () => {
    const dir = await makeDir()
    const envFile = path.join(dir, '.env')

    const result = await updateEnv({ envFile, envVars: ['GITHUB_TOKEN'] })
    const content = await readFile(envFile, 'utf-8')

    expect(result).toBe('added')
    expect(content).toContain('GITHUB_TOKEN=')
  })

  it('does not duplicate existing variables', async () => {
    const dir = await makeDir()
    const envFile = path.join(dir, '.env')
    await writeFile(envFile, 'GITHUB_TOKEN=abc\n', 'utf-8')

    const result = await updateEnv({ envFile, envVars: ['GITHUB_TOKEN'] })
    const content = await readFile(envFile, 'utf-8')

    expect(result).toBe('skipped')
    expect(content.match(/GITHUB_TOKEN/g)).toHaveLength(1)
    expect(content).toContain('GITHUB_TOKEN=abc')
  })

  it('appends only missing variables to an existing file', async () => {
    const dir = await makeDir()
    const envFile = path.join(dir, '.env')
    await writeFile(envFile, 'EXISTING=1', 'utf-8')

    const result = await updateEnv({ envFile, envVars: ['EXISTING', 'NEW_TOKEN'] })
    const content = await readFile(envFile, 'utf-8')

    expect(result).toBe('added')
    expect(content).toContain('EXISTING=1')
    expect(content).toContain('NEW_TOKEN=')
    expect(content.match(/EXISTING/g)).toHaveLength(1)
  })
})

describe('removeFromEnv', () => {
  it('removes empty placeholder lines only', async () => {
    const dir = await makeDir()
    const envFile = path.join(dir, '.env')
    await writeFile(envFile, 'OTHER=keep\nGITHUB_TOKEN=\n', 'utf-8')

    const { result, kept } = await removeFromEnv({ envFile, envVars: ['GITHUB_TOKEN'] })
    const content = await readFile(envFile, 'utf-8')

    expect(result).toBe('removed')
    expect(kept).toEqual([])
    expect(content).not.toContain('GITHUB_TOKEN')
    expect(content).toContain('OTHER=keep')
  })

  it('keeps variables that still hold a value', async () => {
    const dir = await makeDir()
    const envFile = path.join(dir, '.env')
    await writeFile(envFile, 'GITHUB_TOKEN=secret\n', 'utf-8')

    const { result, kept } = await removeFromEnv({ envFile, envVars: ['GITHUB_TOKEN'] })
    const content = await readFile(envFile, 'utf-8')

    expect(result).toBe('skipped')
    expect(kept).toEqual(['GITHUB_TOKEN'])
    expect(content).toContain('GITHUB_TOKEN=secret')
  })

  it('skips when the file does not exist', async () => {
    const dir = await makeDir()
    const envFile = path.join(dir, '.env')

    const { result } = await removeFromEnv({ envFile, envVars: ['GITHUB_TOKEN'] })

    expect(result).toBe('skipped')
  })
})
