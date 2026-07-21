import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import fs from 'fs-extra'
import path from 'path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { applyExtension } from '@/core/apply-extension'
import { clearRegistryCache } from '@/registry/fetcher'
import { buildLocalRegistry, getLocalExtension, localRegistries } from '@/test/local-registry'
import { scaffoldTemplate } from '@/utils/create-project'
import { preflight } from '@/utils/preflight'
import type * as InstallDepsModule from '@/utils/updaters/install-deps'
import { uninstallDeps } from '@/utils/updaters/install-deps'

import { remove } from './remove'

vi.mock('@/utils/updaters/install-deps', async (importOriginal) => {
  const actual = await importOriginal<typeof InstallDepsModule>()
  return { ...actual, uninstallDeps: vi.fn(() => Promise.resolve()) }
})

const TEMPLATES_DIR = fileURLToPath(new URL('../../../../templates', import.meta.url))
process.env.DASHFY_TEMPLATE_DIR = TEMPLATES_DIR

let registryDir: string
let cleanups: string[] = []

beforeAll(async () => {
  registryDir = await buildLocalRegistry()
})

afterAll(async () => {
  await fs.remove(registryDir)
})

beforeEach(() => {
  clearRegistryCache()
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
})

afterEach(async () => {
  vi.clearAllMocks()
  await Promise.all(cleanups.map((dir) => fs.remove(dir).catch(() => undefined)))
  cleanups = []
})

/** Scaffolds a project, points it at the local registry, and sets up github. */
async function scaffoldWithGithub(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-remove-'))
  cleanups.push(dir)
  const target = path.join(dir, 'app')
  await scaffoldTemplate({ templateDir: 'vite-starter', projectPath: target })
  await fs.writeJson(path.join(target, 'dashfy.json'), { registries: localRegistries(registryDir) })

  const project = await preflight(target)
  const github = await getLocalExtension(registryDir, 'github')
  await applyExtension({ project, item: github })

  return target
}

describe('remove', () => {
  it('tears down the extension and uninstalls deps by default', async () => {
    const cwd = await scaffoldWithGithub()

    await remove.parseAsync(['github', '-c', cwd, '--yes'], { from: 'user' })

    const project = await preflight(cwd)
    const app = await readFile(project.appFile, 'utf-8')
    const server = await readFile(project.serverFile!, 'utf-8')

    expect(app).not.toContain("WidgetRegistry.addExtension('github'")
    expect(server).not.toContain("dashfy.registerApi('github'")
    expect(uninstallDeps).toHaveBeenCalledTimes(1)
    const call = vi.mocked(uninstallDeps).mock.calls[0]?.[0]
    expect(call?.packages).toContain('@getdashfy/ext-github')
  })

  it('keeps deps with --keep-deps', async () => {
    const cwd = await scaffoldWithGithub()

    await remove.parseAsync(['github', '-c', cwd, '--yes', '--keep-deps'], { from: 'user' })

    const project = await preflight(cwd)
    const app = await readFile(project.appFile, 'utf-8')
    expect(app).not.toContain("WidgetRegistry.addExtension('github'")
    expect(uninstallDeps).not.toHaveBeenCalled()
  })

  it('writes nothing on --dry-run', async () => {
    const cwd = await scaffoldWithGithub()
    const project = await preflight(cwd)
    const before = await readFile(project.appFile, 'utf-8')

    await remove.parseAsync(['github', '-c', cwd, '--dry-run'], { from: 'user' })

    expect(await readFile(project.appFile, 'utf-8')).toBe(before)
    expect(uninstallDeps).not.toHaveBeenCalled()
  })
})
