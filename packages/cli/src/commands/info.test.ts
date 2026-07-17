import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { describe, expect, it } from 'vitest'

import { DEFAULT_APP_PATH } from '@/constants/paths'
import { CONFIG_SCHEMA_URL, DOCS_URL } from '@/constants/site'

import { collectInfo } from './info'

async function tmp(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'dashfy-info-'))
}

describe('collectInfo', () => {
  it('reports config, installed extensions, and links', async () => {
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'package.json'), {
      name: 'demo',
      dependencies: { '@dashfy/ext-github': '^0.1.0', react: '^18.0.0' },
    })
    await fs.writeJson(path.join(cwd, 'dashfy.json'), {
      registries: { '@acme': 'https://acme.com/r/{name}.json' },
      paths: { app: DEFAULT_APP_PATH },
    })

    const data = await collectInfo(cwd)

    expect(data.config.paths?.app).toBe(DEFAULT_APP_PATH)
    expect(data.config.registries['@dashfy']).toBeDefined()
    expect(data.config.registries['@acme']).toBe('https://acme.com/r/{name}.json')
    expect(data.installedExtensions).toContain('@dashfy/ext-github')
    expect(data.installedExtensions).not.toContain('react')
    expect(data.links.registry).toBeDefined()
    expect(data.links.registries).toBeDefined()
    expect(data.links.docs).toBe(DOCS_URL)
    expect(data.links.schema).toBe(CONFIG_SCHEMA_URL)
  })

  it('returns null project when no app file is present', async () => {
    const cwd = await tmp()
    await fs.writeJson(path.join(cwd, 'package.json'), { name: 'empty' })
    const data = await collectInfo(cwd)
    expect(data.project).toBeNull()
    expect(data.installedExtensions).toEqual([])
  })
})
