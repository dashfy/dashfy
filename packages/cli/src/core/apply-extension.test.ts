import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import fs from 'fs-extra'
import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { applyExtension } from '@/core/apply-extension'
import { buildLocalRegistry, getLocalExtension } from '@/test/local-registry'
import { scaffoldTemplate } from '@/utils/create-project'
import { preflight } from '@/utils/preflight'

const TEMPLATES_DIR = fileURLToPath(new URL('../../../../templates', import.meta.url))

process.env.DASHFY_TEMPLATE_DIR = TEMPLATES_DIR

let registryDir: string

beforeAll(async () => {
  registryDir = await buildLocalRegistry()
})

afterAll(async () => {
  await fs.remove(registryDir)
})

async function scaffold(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-apply-'))
  const target = path.join(dir, 'app')
  await scaffoldTemplate({ templateDir: 'vite-starter', projectPath: target })
  return target
}

describe('applyExtension', () => {
  it('sets up an extension without installing when no package manager is given', async () => {
    const target = await scaffold()
    const project = await preflight(target)
    const github = await getLocalExtension(registryDir, 'github')

    const result = await applyExtension({ project, item: github })

    expect(result.installed).toBe(false)
    expect(result.app).toBe('added')
    expect(result.server).toBe('added')
    expect(result.env).toBe('added')

    const app = await readFile(project.appFile, 'utf-8')
    expect(app).toContain("WidgetRegistry.addExtension('github'")
  })

  it('is idempotent on re-apply', async () => {
    const target = await scaffold()
    const project = await preflight(target)
    const github = await getLocalExtension(registryDir, 'github')

    await applyExtension({ project, item: github })
    const second = await applyExtension({ project, item: github })

    expect(second.app).toBe('skipped')
  })
})
