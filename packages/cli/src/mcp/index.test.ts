import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearRegistryCache } from '@/registry/fetcher'
import { buildLocalRegistry, localRegistries } from '@/test/local-registry'
import type * as GetPackageManagerModule from '@/utils/get-package-manager'

import {
  buildAuditChecklist,
  getAddCommand,
  getDocsForItems,
  getProjectRegistries,
  listItems,
  searchItems,
  viewItems,
} from './index'

vi.mock('@/utils/get-package-manager', async (importOriginal) => ({
  ...(await importOriginal<typeof GetPackageManagerModule>()),
  getPackageManager: vi.fn(() => Promise.resolve('pnpm')),
}))

let registryDir: string
let cleanups: string[] = []

async function projectDir(): Promise<string> {
  const cwd = await mkdtemp(path.join(tmpdir(), 'dashfy-mcp-'))
  cleanups.push(cwd)
  await fs.writeJson(path.join(cwd, 'dashfy.json'), { registries: localRegistries(registryDir) })
  return cwd
}

beforeEach(async () => {
  clearRegistryCache()
  registryDir = await buildLocalRegistry()
  cleanups.push(registryDir)
})

afterEach(async () => {
  await Promise.all(cleanups.map((dir) => fs.remove(dir).catch(() => undefined)))
  cleanups = []
})

describe('mcp tools', () => {
  it('get_project_registries lists the configured @getdashfy registry', async () => {
    const cwd = await projectDir()
    const text = await getProjectRegistries(cwd)
    expect(text).toContain('@getdashfy ->')
  })

  it('list_items_in_registries returns the built extensions', async () => {
    const cwd = await projectDir()
    const text = await listItems(cwd, {})
    expect(text).toContain('@getdashfy/github')
    expect(text).toMatch(/Found \d+ items/)
  })

  it('search_items_in_registries filters by query', async () => {
    const cwd = await projectDir()
    const text = await searchItems(cwd, { query: 'github' })
    expect(text).toContain('@getdashfy/github')
    expect(text).not.toContain('@getdashfy/nba')
    expect(text).toContain('Add: pnpm dlx dashfy@latest add @getdashfy/github')
  })

  it('view_items_in_registries renders full details', async () => {
    const cwd = await projectDir()
    const text = await viewItems(cwd, ['github'])
    expect(text).toContain('# @getdashfy/github')
    expect(text).toContain('Widgets:')
  })

  it('get_add_command_for_items returns the runner-prefixed dashfy add command', async () => {
    const cwd = await projectDir()
    const text = await getAddCommand(cwd, ['github'])
    expect(text).toContain('pnpm dlx dashfy@latest add @getdashfy/github')
  })

  it('get_docs_for_items renders setup-oriented docs with a runner-prefixed install command', async () => {
    const cwd = await projectDir()
    const text = await getDocsForItems(cwd, ['github'])
    expect(text).toContain('@getdashfy/github — GitHub')
    expect(text).toContain('Setup')
    expect(text).toContain('GITHUB_TOKEN')
    expect(text).toContain('Integration')
    expect(text).toContain('Extension key: github')
    expect(text).toContain('pnpm dlx dashfy@latest add @getdashfy/github')
  })

  it('get_audit_checklist surfaces missing env vars and setup for added items', async () => {
    const cwd = await projectDir()
    const previous = process.env.GITHUB_TOKEN
    delete process.env.GITHUB_TOKEN

    try {
      const text = await buildAuditChecklist(cwd, ['github'])
      expect(text).toContain('[ ] Set GITHUB_TOKEN in .env')
      expect(text).toContain("dashfy.registerApi('github'")
      expect(text).toContain("WidgetRegistry.addExtension('github'")
      // No package.json in the temp project, so it is not detected as a project.
      expect(text).toContain('No Dashfy project was detected')
    } finally {
      if (previous !== undefined) {
        process.env.GITHUB_TOKEN = previous
      }
    }
  })
})
