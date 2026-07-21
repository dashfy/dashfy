import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { describe, expect, it } from 'vitest'

import { DEFAULT_APP_PATH } from '@/constants/paths'
import { BUILTIN_REGISTRY_NAMESPACE } from '@/registry/constants'
import { addRegistries, getConfig, resolveConfig, writeConfig } from '@/utils/get-config'

async function tmp(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-config-'))
}

describe('getConfig', () => {
  it('returns null when no dashfy.json exists', async () => {
    expect(await getConfig(await tmp())).toBeNull()
  })

  it('reads and validates dashfy.json', async () => {
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), {
      registries: { '@acme': 'https://acme.com/r/{name}.json' },
      paths: { app: DEFAULT_APP_PATH },
    })
    const config = await getConfig(cwd)
    expect(config?.paths?.app).toBe(DEFAULT_APP_PATH)
    expect(config?.registries?.['@acme']).toBeDefined()
  })

  it('throws on invalid config', async () => {
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), {
      registries: { acme: 'https://acme.com/r/{name}.json' },
    })
    await expect(getConfig(cwd)).rejects.toThrow()
  })
})

describe('resolveConfig', () => {
  it('always exposes the built-in @getdashfy registry', async () => {
    const config = await resolveConfig(await tmp())
    expect(config.registries[BUILTIN_REGISTRY_NAMESPACE]).toBeDefined()
    expect(config.userRegistries).toBeUndefined()
  })

  it('merges user registries over the built-ins', async () => {
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), {
      registries: { [BUILTIN_REGISTRY_NAMESPACE]: 'file:///tmp/{name}.json' },
    })
    const config = await resolveConfig(cwd)
    expect(config.registries[BUILTIN_REGISTRY_NAMESPACE]).toBe('file:///tmp/{name}.json')
    expect(config.userRegistries?.[BUILTIN_REGISTRY_NAMESPACE]).toBe('file:///tmp/{name}.json')
  })
})

describe('writeConfig', () => {
  it('writes a dashfy.json with the schema reference', async () => {
    const cwd = await tmp()
    await writeConfig(cwd, { paths: { app: DEFAULT_APP_PATH } })
    const written = await fs.readJson(path.join(cwd, 'dashfy.json'))
    expect(written.$schema).toBeDefined()
    expect(written.paths.app).toBe(DEFAULT_APP_PATH)
  })
})

describe('addRegistries', () => {
  it('creates dashfy.json with the merged registries', async () => {
    const cwd = await tmp()
    await addRegistries(cwd, { '@acme': 'https://acme.com/r/{name}.json' })
    const written = await fs.readJson(path.join(cwd, 'dashfy.json'))
    expect(written.registries['@acme']).toBe('https://acme.com/r/{name}.json')
    expect(written.$schema).toBeDefined()
  })

  it('merges into existing registries and preserves other config', async () => {
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'dashfy.json'), {
      registries: { '@acme': 'https://acme.com/r/{name}.json' },
      paths: { app: DEFAULT_APP_PATH },
    })
    await addRegistries(cwd, { '@beta': 'https://beta.dev/r/{name}.json' })
    const written = await fs.readJson(path.join(cwd, 'dashfy.json'))
    expect(written.registries['@acme']).toBeDefined()
    expect(written.registries['@beta']).toBeDefined()
    expect(written.paths.app).toBe(DEFAULT_APP_PATH)
  })
})
