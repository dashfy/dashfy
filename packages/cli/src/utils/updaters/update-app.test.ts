import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import path from 'path'
import { describe, expect, it } from 'vitest'

import { removeFromApp, updateApp } from '@/utils/updaters/update-app'

const MINIMAL_APP = `import { Dashfy } from '@dashfy/ui'

export const App = () => {
  return <Dashfy />
}
`

async function makeAppFile(content = MINIMAL_APP): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-app-'))
  const appFile = path.join(dir, 'App.tsx')
  await writeFile(appFile, content, 'utf-8')
  return appFile
}

describe('updateApp', () => {
  it('adds widget imports and registers the extension', async () => {
    const appFile = await makeAppFile()

    const result = await updateApp({
      appFile,
      extensionKey: 'github',
      widgetPackage: '@dashfy/ext-github',
      widgets: ['Status', 'RepoBadge'],
    })

    const content = await readFile(appFile, 'utf-8')

    expect(result).toBe('added')
    expect(content).toContain("WidgetRegistry.addExtension('github'")
    expect(content).toContain('WidgetRegistry')
    expect(content).toMatch(/from '@dashfy\/ext-github'/)
    expect(content).toContain('Status')
    expect(content).toContain('RepoBadge')
  })

  it('merges WidgetRegistry into the existing @dashfy/ui import', async () => {
    const appFile = await makeAppFile()

    await updateApp({
      appFile,
      extensionKey: 'github',
      widgetPackage: '@dashfy/ext-github',
      widgets: ['Status'],
    })

    const content = await readFile(appFile, 'utf-8')
    const uiImports = content.match(/from '@dashfy\/ui'/g) ?? []
    expect(uiImports).toHaveLength(1)
    expect(content).toMatch(/import \{ Dashfy, WidgetRegistry \} from '@dashfy\/ui'/)
  })

  it('is idempotent on re-run', async () => {
    const appFile = await makeAppFile()
    const options = {
      appFile,
      extensionKey: 'github',
      widgetPackage: '@dashfy/ext-github',
      widgets: ['Status'],
    }

    await updateApp(options)
    const first = await readFile(appFile, 'utf-8')

    const second = await updateApp(options)
    const after = await readFile(appFile, 'utf-8')

    expect(second).toBe('skipped')
    expect(after).toBe(first)
  })
})

describe('removeFromApp', () => {
  it('removes the registration and widget imports, restoring the original', async () => {
    const appFile = await makeAppFile()
    const options = {
      appFile,
      extensionKey: 'github',
      widgetPackage: '@dashfy/ext-github',
      widgets: ['Status', 'RepoBadge'],
    }

    await updateApp(options)
    const removed = await removeFromApp(options)
    const content = await readFile(appFile, 'utf-8')

    expect(removed).toBe('removed')
    expect(content).not.toContain("WidgetRegistry.addExtension('github'")
    expect(content).not.toContain('@dashfy/ext-github')
    expect(content).not.toContain('WidgetRegistry')
    expect(content).toContain("import { Dashfy } from '@dashfy/ui'")
  })

  it('skips when the extension is not registered', async () => {
    const appFile = await makeAppFile()

    const removed = await removeFromApp({
      appFile,
      extensionKey: 'github',
      widgetPackage: '@dashfy/ext-github',
      widgets: ['Status'],
    })

    expect(removed).toBe('skipped')
  })

  it('keeps WidgetRegistry when another extension still uses it', async () => {
    const appFile = await makeAppFile()
    await updateApp({
      appFile,
      extensionKey: 'github',
      widgetPackage: '@dashfy/ext-github',
      widgets: ['Status'],
    })
    await updateApp({
      appFile,
      extensionKey: 'nba',
      widgetPackage: '@dashfy/ext-nba',
      widgets: ['Scores'],
    })

    await removeFromApp({
      appFile,
      extensionKey: 'github',
      widgetPackage: '@dashfy/ext-github',
      widgets: ['Status'],
    })
    const content = await readFile(appFile, 'utf-8')

    expect(content).not.toContain("WidgetRegistry.addExtension('github'")
    expect(content).toContain("WidgetRegistry.addExtension('nba'")
    expect(content).toContain('WidgetRegistry')
    expect(content).not.toContain('@dashfy/ext-github')
    expect(content).toContain('@dashfy/ext-nba')
  })
})
