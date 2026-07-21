import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import fs from 'fs-extra'
import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { runInit } from '@/commands/init'
import { DEFAULT_APP_PATH, DEFAULT_ENV_PATH, DEFAULT_SERVER_PATH } from '@/constants/paths'
import { buildLocalRegistry, localRegistries } from '@/test/local-registry'

const TEMPLATES_DIR = fileURLToPath(new URL('../../../../templates', import.meta.url))

interface PackageJson {
  name: string
  dependencies?: Record<string, string>
}

let registryDir: string

beforeAll(async () => {
  // Scaffold from the repo's standalone templates instead of fetching via git.
  process.env.DASHFY_TEMPLATE_DIR = TEMPLATES_DIR
  registryDir = await buildLocalRegistry()
})

afterAll(async () => {
  await fs.remove(registryDir)
})

/** Points the cwd's `@getdashfy` namespace at the locally built registry. */
async function writeLocalConfig(cwd: string): Promise<void> {
  await fs.writeJson(path.join(cwd, 'dashfy.json'), { registries: localRegistries(registryDir) })
}

describe('runInit (as-is template, -t vite-app)', () => {
  it('copies the full demo verbatim and rewrites the package name', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-init-asis-'))
    const { targetDir } = await runInit('demo', {
      cwd,
      template: 'vite-app',
      install: false,
      yes: true,
    })

    const pkg = (await fs.readJson(path.join(targetDir, 'package.json'))) as PackageJson
    expect(pkg.name).toBe('demo')
    expect(pkg.dependencies?.['@getdashfy/ext-github']).toBeDefined()
    expect(pkg.dependencies?.['@getdashfy/ext-nba']).toBeDefined()

    const app = await readFile(path.join(targetDir, DEFAULT_APP_PATH), 'utf-8')
    expect(app).toContain("WidgetRegistry.addExtension('github'")
    expect(app).toContain("WidgetRegistry.addExtension('nba'")

    // .env should be created from .env.example, and the example preserved.
    expect(await fs.pathExists(path.join(targetDir, DEFAULT_ENV_PATH))).toBe(true)
    expect(await fs.pathExists(path.join(targetDir, '.env.example'))).toBe(true)

    // A dashfy.json is written into the scaffolded project.
    expect(await fs.pathExists(path.join(targetDir, 'dashfy.json'))).toBe(true)
  })
})

const ASTRO_APP_PATH = 'src/components/DashfyApp.tsx'

describe('runInit (as-is template, -t astro-app)', () => {
  it('copies the full Astro demo and records the framework app path', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-init-astro-asis-'))
    const { targetDir } = await runInit('demo', {
      cwd,
      template: 'astro-app',
      install: false,
      yes: true,
    })

    const pkg = (await fs.readJson(path.join(targetDir, 'package.json'))) as PackageJson
    expect(pkg.name).toBe('demo')
    expect(pkg.dependencies?.['@getdashfy/ext-github']).toBeDefined()
    expect(pkg.dependencies?.['@getdashfy/ext-nba']).toBeDefined()

    const app = await readFile(path.join(targetDir, ASTRO_APP_PATH), 'utf-8')
    expect(app).toContain("WidgetRegistry.addExtension('github'")
    expect(app).toContain("WidgetRegistry.addExtension('nba'")

    expect(await fs.pathExists(path.join(targetDir, DEFAULT_ENV_PATH))).toBe(true)

    // dashfy.json records the Astro-specific app path so codemods target the island.
    const config = (await fs.readJson(path.join(targetDir, 'dashfy.json'))) as {
      paths?: { app?: string }
    }
    expect(config.paths?.app).toBe(ASTRO_APP_PATH)
  })
})

describe('runInit (interactive template, -t astro-starter)', () => {
  it('scaffolds the minimal Astro template and sets up extensions in the island', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-init-astro-interactive-'))
    await writeLocalConfig(cwd)
    const { targetDir } = await runInit('app', {
      cwd,
      template: 'astro-starter',
      extensions: 'github,system',
      install: false,
      yes: true,
    })

    const pkg = (await fs.readJson(path.join(targetDir, 'package.json'))) as PackageJson
    expect(pkg.name).toBe('app')
    expect(pkg.dependencies?.['@getdashfy/ext-github']).toBeDefined()
    expect(pkg.dependencies?.['@getdashfy/ext-system']).toBeDefined()

    const app = await readFile(path.join(targetDir, ASTRO_APP_PATH), 'utf-8')
    expect(app).toContain("WidgetRegistry.addExtension('github'")
    expect(app).toContain("WidgetRegistry.addExtension('system'")

    const server = await readFile(path.join(targetDir, DEFAULT_SERVER_PATH), 'utf-8')
    expect(server).toContain("dashfy.registerApi('github'")
    expect(server).toContain("dashfy.registerApi('system', createSystemClient(), 'push')")

    const env = await readFile(path.join(targetDir, DEFAULT_ENV_PATH), 'utf-8')
    expect(env).toContain('GITHUB_TOKEN=')
  })
})

const NEXT_APP_PATH = 'components/DashfyApp.tsx'

describe('runInit (as-is template, -t next-app)', () => {
  it('copies the full Next.js demo and records the framework app path', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-init-next-asis-'))
    const { targetDir } = await runInit('demo', {
      cwd,
      template: 'next-app',
      install: false,
      yes: true,
    })

    const pkg = (await fs.readJson(path.join(targetDir, 'package.json'))) as PackageJson
    expect(pkg.name).toBe('demo')
    expect(pkg.dependencies?.['@getdashfy/ext-github']).toBeDefined()
    expect(pkg.dependencies?.['@getdashfy/ext-nba']).toBeDefined()

    const app = await readFile(path.join(targetDir, NEXT_APP_PATH), 'utf-8')
    expect(app).toContain("WidgetRegistry.addExtension('github'")
    expect(app).toContain("WidgetRegistry.addExtension('nba'")

    expect(await fs.pathExists(path.join(targetDir, DEFAULT_ENV_PATH))).toBe(true)

    // dashfy.json records the Next-specific app path so codemods target the island.
    const config = (await fs.readJson(path.join(targetDir, 'dashfy.json'))) as {
      paths?: { app?: string }
    }
    expect(config.paths?.app).toBe(NEXT_APP_PATH)
  })
})

describe('runInit (interactive template, -t next-starter)', () => {
  it('scaffolds the minimal Next.js template and sets up extensions in the island', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-init-next-interactive-'))
    await writeLocalConfig(cwd)
    const { targetDir } = await runInit('app', {
      cwd,
      template: 'next-starter',
      extensions: 'github,system',
      install: false,
      yes: true,
    })

    const pkg = (await fs.readJson(path.join(targetDir, 'package.json'))) as PackageJson
    expect(pkg.name).toBe('app')
    expect(pkg.dependencies?.['@getdashfy/ext-github']).toBeDefined()
    expect(pkg.dependencies?.['@getdashfy/ext-system']).toBeDefined()

    const app = await readFile(path.join(targetDir, NEXT_APP_PATH), 'utf-8')
    expect(app).toContain("WidgetRegistry.addExtension('github'")
    expect(app).toContain("WidgetRegistry.addExtension('system'")

    const server = await readFile(path.join(targetDir, DEFAULT_SERVER_PATH), 'utf-8')
    expect(server).toContain("dashfy.registerApi('github'")
    expect(server).toContain("dashfy.registerApi('system', createSystemClient(), 'push')")

    const env = await readFile(path.join(targetDir, DEFAULT_ENV_PATH), 'utf-8')
    expect(env).toContain('GITHUB_TOKEN=')
  })
})

const RR_APP_PATH = 'app/components/DashfyApp.tsx'

describe('runInit (as-is template, -t react-router-app)', () => {
  it('copies the full React Router demo and records the framework app path', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-init-rr-asis-'))
    const { targetDir } = await runInit('demo', {
      cwd,
      template: 'react-router-app',
      install: false,
      yes: true,
    })

    const pkg = (await fs.readJson(path.join(targetDir, 'package.json'))) as PackageJson
    expect(pkg.name).toBe('demo')
    expect(pkg.dependencies?.['@getdashfy/ext-github']).toBeDefined()
    expect(pkg.dependencies?.['@getdashfy/ext-nba']).toBeDefined()

    const app = await readFile(path.join(targetDir, RR_APP_PATH), 'utf-8')
    expect(app).toContain("WidgetRegistry.addExtension('github'")
    expect(app).toContain("WidgetRegistry.addExtension('nba'")

    expect(await fs.pathExists(path.join(targetDir, DEFAULT_ENV_PATH))).toBe(true)

    // dashfy.json records the React Router-specific app path so codemods target the island.
    const config = (await fs.readJson(path.join(targetDir, 'dashfy.json'))) as {
      paths?: { app?: string }
    }
    expect(config.paths?.app).toBe(RR_APP_PATH)
  })
})

describe('runInit (interactive template, -t react-router-starter)', () => {
  it('scaffolds the minimal React Router template and sets up extensions in the island', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-init-rr-interactive-'))
    await writeLocalConfig(cwd)
    const { targetDir } = await runInit('app', {
      cwd,
      template: 'react-router-starter',
      extensions: 'github,system',
      install: false,
      yes: true,
    })

    const pkg = (await fs.readJson(path.join(targetDir, 'package.json'))) as PackageJson
    expect(pkg.name).toBe('app')
    expect(pkg.dependencies?.['@getdashfy/ext-github']).toBeDefined()
    expect(pkg.dependencies?.['@getdashfy/ext-system']).toBeDefined()

    const app = await readFile(path.join(targetDir, RR_APP_PATH), 'utf-8')
    expect(app).toContain("WidgetRegistry.addExtension('github'")
    expect(app).toContain("WidgetRegistry.addExtension('system'")

    const server = await readFile(path.join(targetDir, DEFAULT_SERVER_PATH), 'utf-8')
    expect(server).toContain("dashfy.registerApi('github'")
    expect(server).toContain("dashfy.registerApi('system', createSystemClient(), 'push')")

    const env = await readFile(path.join(targetDir, DEFAULT_ENV_PATH), 'utf-8')
    expect(env).toContain('GITHUB_TOKEN=')
  })
})

const START_APP_PATH = 'src/components/DashfyApp.tsx'

describe('runInit (as-is template, -t start-app)', () => {
  it('copies the full TanStack Start demo and records the framework app path', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-init-start-asis-'))
    const { targetDir } = await runInit('demo', {
      cwd,
      template: 'start-app',
      install: false,
      yes: true,
    })

    const pkg = (await fs.readJson(path.join(targetDir, 'package.json'))) as PackageJson
    expect(pkg.name).toBe('demo')
    expect(pkg.dependencies?.['@getdashfy/ext-github']).toBeDefined()
    expect(pkg.dependencies?.['@getdashfy/ext-nba']).toBeDefined()

    const app = await readFile(path.join(targetDir, START_APP_PATH), 'utf-8')
    expect(app).toContain("WidgetRegistry.addExtension('github'")
    expect(app).toContain("WidgetRegistry.addExtension('nba'")

    expect(await fs.pathExists(path.join(targetDir, DEFAULT_ENV_PATH))).toBe(true)

    // dashfy.json records the TanStack Start-specific app path so codemods target the island.
    const config = (await fs.readJson(path.join(targetDir, 'dashfy.json'))) as {
      paths?: { app?: string }
    }
    expect(config.paths?.app).toBe(START_APP_PATH)
  })
})

describe('runInit (interactive template, -t start-starter)', () => {
  it('scaffolds the minimal TanStack Start template and sets up extensions in the island', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-init-start-interactive-'))
    await writeLocalConfig(cwd)
    const { targetDir } = await runInit('app', {
      cwd,
      template: 'start-starter',
      extensions: 'github,system',
      install: false,
      yes: true,
    })

    const pkg = (await fs.readJson(path.join(targetDir, 'package.json'))) as PackageJson
    expect(pkg.name).toBe('app')
    expect(pkg.dependencies?.['@getdashfy/ext-github']).toBeDefined()
    expect(pkg.dependencies?.['@getdashfy/ext-system']).toBeDefined()

    const app = await readFile(path.join(targetDir, START_APP_PATH), 'utf-8')
    expect(app).toContain("WidgetRegistry.addExtension('github'")
    expect(app).toContain("WidgetRegistry.addExtension('system'")

    const server = await readFile(path.join(targetDir, DEFAULT_SERVER_PATH), 'utf-8')
    expect(server).toContain("dashfy.registerApi('github'")
    expect(server).toContain("dashfy.registerApi('system', createSystemClient(), 'push')")

    const env = await readFile(path.join(targetDir, DEFAULT_ENV_PATH), 'utf-8')
    expect(env).toContain('GITHUB_TOKEN=')
  })
})

describe('runInit (interactive template, default vite-starter)', () => {
  it('scaffolds the minimal template and sets up the chosen extensions', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-init-interactive-'))
    await writeLocalConfig(cwd)
    const { targetDir } = await runInit('app', {
      cwd,
      extensions: 'github,system',
      install: false,
      yes: true,
    })

    const pkg = (await fs.readJson(path.join(targetDir, 'package.json'))) as PackageJson
    expect(pkg.name).toBe('app')
    expect(pkg.dependencies?.['@getdashfy/ext-github']).toBeDefined()
    expect(pkg.dependencies?.['@getdashfy/ext-system']).toBeDefined()

    const app = await readFile(path.join(targetDir, DEFAULT_APP_PATH), 'utf-8')
    expect(app).toContain("WidgetRegistry.addExtension('github'")
    expect(app).toContain("WidgetRegistry.addExtension('system'")

    const server = await readFile(path.join(targetDir, DEFAULT_SERVER_PATH), 'utf-8')
    expect(server).toContain("dashfy.registerApi('github'")
    expect(server).toContain("dashfy.registerApi('system', createSystemClient(), 'push')")

    const env = await readFile(path.join(targetDir, DEFAULT_ENV_PATH), 'utf-8')
    expect(env).toContain('GITHUB_TOKEN=')
  })

  it('is idempotent when re-run against an existing project', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-init-idempotent-'))
    await writeLocalConfig(cwd)
    const { targetDir } = await runInit('app', {
      cwd,
      extensions: 'github',
      install: false,
      yes: true,
    })

    const appAfterFirst = await readFile(path.join(targetDir, DEFAULT_APP_PATH), 'utf-8')
    const serverAfterFirst = await readFile(path.join(targetDir, DEFAULT_SERVER_PATH), 'utf-8')

    // Re-running the same setup on the scaffolded project must be a no-op.
    const { preflight } = await import('@/utils/preflight')
    const { setupExtension } = await import('@/core/setup-extension')
    const { getLocalExtension } = await import('@/test/local-registry')

    const project = await preflight(targetDir)
    const result = await setupExtension(project, await getLocalExtension(registryDir, 'github'))
    expect(result.app).toBe('skipped')

    expect(await readFile(path.join(targetDir, DEFAULT_APP_PATH), 'utf-8')).toBe(appAfterFirst)
    expect(await readFile(path.join(targetDir, DEFAULT_SERVER_PATH), 'utf-8')).toBe(
      serverAfterFirst,
    )
  })
})
