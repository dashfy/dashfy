import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import fs from 'fs-extra'
import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { setupExtension, stripVersion, teardownExtension } from '@/core/setup-extension'
import { buildLocalRegistry, getLocalExtension } from '@/test/local-registry'
import { scaffoldTemplate } from '@/utils/create-project'
import { preflight } from '@/utils/preflight'

const TEMPLATES_DIR = fileURLToPath(new URL('../../../../templates', import.meta.url))

// Use the repo's standalone templates as a local source (no git fetch).
process.env.DASHFY_TEMPLATE_DIR = TEMPLATES_DIR

let registryDir: string

beforeAll(async () => {
  registryDir = await buildLocalRegistry()
})

afterAll(async () => {
  await fs.remove(registryDir)
})

function getExtension(name: string): ReturnType<typeof getLocalExtension> {
  return getLocalExtension(registryDir, name)
}

async function scaffold(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-setup-'))
  const target = path.join(dir, 'app')
  await scaffoldTemplate({ templateDir: 'vite-starter', projectPath: target })
  return target
}

describe('stripVersion', () => {
  it('removes the version range from a dependency spec', () => {
    expect(stripVersion('@getdashfy/ext-github@^0.1.0')).toBe('@getdashfy/ext-github')
    expect(stripVersion('@getdashfy/ext-system@1.2.3')).toBe('@getdashfy/ext-system')
  })
})

describe('setupExtension (template integration)', () => {
  it('sets up github (poll + env) in the template', async () => {
    const target = await scaffold()
    const project = await preflight(target)
    const github = await getExtension('github')

    const result = await setupExtension(project, github)

    expect(result).toEqual({ app: 'added', server: 'added', config: 'added', env: 'added' })

    const app = await readFile(project.appFile, 'utf-8')
    const server = await readFile(project.serverFile!, 'utf-8')
    const env = await readFile(project.envFile, 'utf-8')

    expect(app).toContain("WidgetRegistry.addExtension('github'")
    expect(server).toContain("dashfy.registerApi('github'")
    expect(env).toContain('GITHUB_TOKEN=')
  })

  it('sets up system as a push API from the /client subpath', async () => {
    const target = await scaffold()
    const project = await preflight(target)
    const system = await getExtension('system')

    const result = await setupExtension(project, system)

    expect(result.server).toBe('added')
    const server = await readFile(project.serverFile!, 'utf-8')
    expect(server).toContain("from '@getdashfy/ext-system/client'")
    expect(server).toContain("dashfy.registerApi('system', createSystemClient(), 'push')")
  })

  it('sets up market-live as frontend-only (no server api)', async () => {
    const target = await scaffold()
    const project = await preflight(target)
    const marketLive = await getExtension('market-live')

    const result = await setupExtension(project, marketLive)

    expect(result.app).toBe('added')
    expect(result.server).toBe('n/a')
    expect(result.env).toBe('n/a')

    const app = await readFile(project.appFile, 'utf-8')
    expect(app).toContain("WidgetRegistry.addExtension('market-live'")
  })

  it('is idempotent across multiple extensions on re-run', async () => {
    const target = await scaffold()
    const project = await preflight(target)
    const items = await Promise.all(
      ['github', 'system', 'market-live'].map((name) => getExtension(name)),
    )

    for (const item of items) {
      await setupExtension(project, item)
    }

    const appAfterFirst = await readFile(project.appFile, 'utf-8')
    const serverAfterFirst = await readFile(project.serverFile!, 'utf-8')
    const configAfterFirst = await readFile(project.configFile!, 'utf-8')

    for (const item of items) {
      const result = await setupExtension(project, item)
      expect(result.app).toBe('skipped')
    }

    expect(await readFile(project.appFile, 'utf-8')).toBe(appAfterFirst)
    expect(await readFile(project.serverFile!, 'utf-8')).toBe(serverAfterFirst)
    expect(await readFile(project.configFile!, 'utf-8')).toBe(configAfterFirst)
  })
})

describe('teardownExtension (template integration)', () => {
  it('removes everything setupExtension added (github)', async () => {
    const target = await scaffold()
    const project = await preflight(target)
    const github = await getExtension('github')

    await setupExtension(project, github)
    const result = await teardownExtension(project, github)

    expect(result.app).toBe('removed')
    expect(result.server).toBe('removed')
    expect(result.config).toBe('removed')
    expect(result.env).toBe('removed')

    const app = await readFile(project.appFile, 'utf-8')
    const server = await readFile(project.serverFile!, 'utf-8')

    expect(app).not.toContain("WidgetRegistry.addExtension('github'")
    expect(app).not.toContain('@getdashfy/ext-github')
    expect(server).not.toContain("dashfy.registerApi('github'")
  })

  it('keeps env vars that hold a value', async () => {
    const target = await scaffold()
    const project = await preflight(target)
    const github = await getExtension('github')

    await setupExtension(project, github)
    await fs.writeFile(project.envFile, 'GITHUB_TOKEN=secret\n', 'utf-8')

    const result = await teardownExtension(project, github)

    expect(result.env).toBe('skipped')
    expect(result.keptEnvVars).toContain('GITHUB_TOKEN')
    expect(await readFile(project.envFile, 'utf-8')).toContain('GITHUB_TOKEN=secret')
  })

  it('skips steps for an extension that was never set up', async () => {
    const target = await scaffold()
    const project = await preflight(target)
    const github = await getExtension('github')

    const result = await teardownExtension(project, github)

    expect(result.app).toBe('skipped')
  })
})
