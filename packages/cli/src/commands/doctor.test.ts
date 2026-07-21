import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import fs from 'fs-extra'
import path from 'path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { applyExtension } from '@/core/apply-extension'
import { isApiSetupInServer, isExtensionSetupInApp } from '@/core/derive-item'
import type { DoctorReport } from '@/core/doctor'
import { packageToAddress, runDoctor } from '@/core/doctor'
import { BUILTIN_REGISTRY_NAMESPACE } from '@/registry/constants'
import { clearRegistryCache } from '@/registry/fetcher'
import { buildLocalRegistry, getLocalExtension, localRegistries } from '@/test/local-registry'
import { scaffoldTemplate } from '@/utils/create-project'
import { preflight } from '@/utils/preflight'

import { doctor } from './doctor'

const TEMPLATES_DIR = fileURLToPath(new URL('../../../../templates', import.meta.url))
process.env.DASHFY_TEMPLATE_DIR = TEMPLATES_DIR

let registryDir: string
let cleanups: string[] = []
let originalToken: string | undefined

beforeAll(async () => {
  registryDir = await buildLocalRegistry()
})

afterAll(async () => {
  await fs.remove(registryDir)
})

beforeEach(() => {
  clearRegistryCache()
  originalToken = process.env.GITHUB_TOKEN
  delete process.env.GITHUB_TOKEN
})

afterEach(async () => {
  vi.restoreAllMocks()
  process.exitCode = 0
  if (originalToken === undefined) {
    delete process.env.GITHUB_TOKEN
  } else {
    process.env.GITHUB_TOKEN = originalToken
  }
  await Promise.all(cleanups.map((dir) => fs.remove(dir).catch(() => undefined)))
  cleanups = []
})

/** Scaffolds a project pointed at the local registry. Optionally sets up github. */
async function scaffold(options: { withGithub?: boolean; deps?: string[] } = {}): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-doctor-'))
  cleanups.push(dir)
  const target = path.join(dir, 'app')
  await scaffoldTemplate({ templateDir: 'vite-starter', projectPath: target })
  await fs.writeJson(path.join(target, 'dashfy.json'), { registries: localRegistries(registryDir) })

  if (options.withGithub) {
    const project = await preflight(target)
    const github = await getLocalExtension(registryDir, 'github')
    await applyExtension({ project, item: github })
  }

  if (options.deps?.length) {
    const pkgPath = path.join(target, 'package.json')
    const pkg = (await fs.readJson(pkgPath)) as { dependencies?: Record<string, string> }
    pkg.dependencies = { ...pkg.dependencies }
    for (const dep of options.deps) {
      pkg.dependencies[dep] = '^0.1.0'
    }
    await fs.writeJson(pkgPath, pkg, { spaces: 2 })
  }

  return target
}

function captureLogs(): string[] {
  const logs: string[] = []
  vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
    logs.push(String(message))
  })
  return logs
}

describe('runDoctor', () => {
  it('reports all checks passing for a healthy, fully set up project', async () => {
    const cwd = await scaffold({ withGithub: true, deps: ['@getdashfy/ext-github'] })
    process.env.GITHUB_TOKEN = 'test-token'

    const report = await runDoctor(cwd, { items: ['@getdashfy/github'] })

    expect(report.ok).toBe(true)
    const github = report.extensions.find((extension) => extension.address === '@getdashfy/github')
    expect(github).toBeDefined()
    expect(github?.checks.every((check) => check.status !== 'fail')).toBe(true)
    const statuses = Object.fromEntries(github!.checks.map((check) => [check.label, check.status]))
    expect(statuses['Environment variable GITHUB_TOKEN']).toBe('pass')
  })

  it('fails when widget setup is missing', async () => {
    const cwd = await scaffold({ deps: ['@getdashfy/ext-github'] })
    process.env.GITHUB_TOKEN = 'test-token'

    const report = await runDoctor(cwd, { items: ['@getdashfy/github'] })

    expect(report.ok).toBe(false)
    const github = report.extensions.find((extension) => extension.address === '@getdashfy/github')
    const appCheck = github?.checks.find((check) => check.label.includes('Widgets registered'))
    expect(appCheck?.status).toBe('fail')
  })

  it('fails when a required env var is missing and passes when set', async () => {
    const cwd = await scaffold({ withGithub: true, deps: ['@getdashfy/ext-github'] })

    const missing = await runDoctor(cwd, { items: ['@getdashfy/github'] })
    const missingEnv = missing.extensions[0]?.checks.find((check) =>
      check.label.includes('GITHUB_TOKEN'),
    )
    expect(missingEnv?.status).toBe('fail')
    expect(missing.ok).toBe(false)

    process.env.GITHUB_TOKEN = 'test-token'
    const present = await runDoctor(cwd, { items: ['@getdashfy/github'] })
    const presentEnv = present.extensions[0]?.checks.find((check) =>
      check.label.includes('GITHUB_TOKEN'),
    )
    expect(presentEnv?.status).toBe('pass')
  })

  it('scopes checks to the passed extension argument', async () => {
    const cwd = await scaffold({
      withGithub: true,
      deps: ['@getdashfy/ext-github', '@getdashfy/ext-nba'],
    })

    const scoped = await runDoctor(cwd, { items: ['@getdashfy/github'] })
    expect(scoped.extensions.map((extension) => extension.address)).toEqual(['@getdashfy/github'])

    const auto = await runDoctor(cwd)
    expect(auto.extensions.map((extension) => extension.address).sort()).toEqual([
      '@getdashfy/github',
      '@getdashfy/nba',
    ])
  })

  it('reports not a Dashfy project for an empty directory', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-doctor-empty-'))
    cleanups.push(cwd)

    const report = await runDoctor(cwd)

    expect(report.project).toBeNull()
    expect(report.ok).toBe(false)
    expect(report.general.some((check) => check.status === 'fail')).toBe(true)
  })
})

describe('doctor command', () => {
  it('sets a non-zero exit code when checks fail', async () => {
    const cwd = await scaffold({ deps: ['@getdashfy/ext-github'] })
    captureLogs()

    await doctor.parseAsync(['@getdashfy/github', '-c', cwd], { from: 'user' })

    expect(process.exitCode).toBe(1)
  })

  it('emits the structured report with --json', async () => {
    const cwd = await scaffold({ withGithub: true, deps: ['@getdashfy/ext-github'] })
    process.env.GITHUB_TOKEN = 'test-token'
    const logs = captureLogs()

    await doctor.parseAsync(['@getdashfy/github', '-c', cwd, '--json'], { from: 'user' })

    const report = JSON.parse(logs.join('\n')) as DoctorReport
    expect(report.project).not.toBeNull()
    expect(Array.isArray(report.extensions)).toBe(true)
    expect(Array.isArray(report.general)).toBe(true)
    expect(report.ok).toBe(true)
    expect(process.exitCode).toBe(0)
  })

  it('exits non-zero for a non-project directory', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-doctor-empty-'))
    cleanups.push(cwd)
    const logs = captureLogs()

    await doctor.parseAsync(['-c', cwd, '--json'], { from: 'user' })

    const report = JSON.parse(logs.join('\n')) as DoctorReport
    expect(report.project).toBeNull()
    expect(process.exitCode).toBe(1)
  })
})

describe('setup helpers', () => {
  it('detects extensions that are set up and not set up', async () => {
    const cwd = await scaffold({ withGithub: true })
    const project = await preflight(cwd)

    expect(isExtensionSetupInApp(project, 'github')).toBe(true)
    expect(isExtensionSetupInApp(project, 'nope')).toBe(false)
    expect(isApiSetupInServer(project, 'github')).toBe(true)
    expect(isApiSetupInServer(project, 'nope')).toBe(false)
  })
})

describe('packageToAddress', () => {
  it('maps package names to registry addresses', () => {
    expect(packageToAddress('@getdashfy/ext-github')).toBe(`${BUILTIN_REGISTRY_NAMESPACE}/github`)
    expect(packageToAddress('ext-github')).toBe(`${BUILTIN_REGISTRY_NAMESPACE}/github`)
    expect(packageToAddress('@acme/ext-foo')).toBe('@acme/foo')
  })
})
