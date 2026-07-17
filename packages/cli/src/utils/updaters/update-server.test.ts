import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import path from 'path'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CONFIG_PATH, DEFAULT_SERVER_PATH } from '@/constants/paths'
import { removeFromServer, updateServer } from '@/utils/updaters/update-server'

const MINIMAL_SERVER = `import { Dashfy } from '@dashfy/server'

const dashfy = new Dashfy()

await dashfy.configureFromFile('./${DEFAULT_CONFIG_PATH}')

await dashfy.start()
`

async function makeServerFile(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-server-'))
  const serverFile = path.join(dir, DEFAULT_SERVER_PATH)
  await writeFile(serverFile, MINIMAL_SERVER, 'utf-8')
  return serverFile
}

describe('updateServer', () => {
  it('registers a poll API with options before start()', async () => {
    const serverFile = await makeServerFile()

    const result = await updateServer({
      serverFile,
      extensionKey: 'github',
      client: {
        import: '@dashfy/ext-github',
        factory: 'createGitHubClient',
        mode: 'poll',
        options: '{ token: process.env.GITHUB_TOKEN! }',
      },
    })

    const content = await readFile(serverFile, 'utf-8')

    expect(result).toBe('added')
    expect(content).toContain("import { createGitHubClient } from '@dashfy/ext-github'")
    expect(content).toContain(
      "dashfy.registerApi('github', createGitHubClient({ token: process.env.GITHUB_TOKEN! }))",
    )
    expect(content.indexOf('registerApi')).toBeLessThan(content.indexOf('dashfy.start()'))
  })

  it('registers a push API with the push mode argument', async () => {
    const serverFile = await makeServerFile()

    await updateServer({
      serverFile,
      extensionKey: 'system',
      client: {
        import: '@dashfy/ext-system/client',
        factory: 'createSystemClient',
        mode: 'push',
      },
    })

    const content = await readFile(serverFile, 'utf-8')
    expect(content).toContain("import { createSystemClient } from '@dashfy/ext-system/client'")
    expect(content).toContain("dashfy.registerApi('system', createSystemClient(), 'push')")
  })

  it('is idempotent on re-run', async () => {
    const serverFile = await makeServerFile()
    const options = {
      serverFile,
      extensionKey: 'nba',
      client: {
        import: '@dashfy/ext-nba',
        factory: 'createNbaClient',
        mode: 'poll' as const,
      },
    }

    await updateServer(options)
    const first = await readFile(serverFile, 'utf-8')

    const second = await updateServer(options)
    const after = await readFile(serverFile, 'utf-8')

    expect(second).toBe('skipped')
    expect(after).toBe(first)
  })
})

describe('removeFromServer', () => {
  it('removes the registerApi call and the factory import', async () => {
    const serverFile = await makeServerFile()
    const client = {
      import: '@dashfy/ext-github',
      factory: 'createGitHubClient',
      mode: 'poll' as const,
      options: '{ token: process.env.GITHUB_TOKEN! }',
    }

    await updateServer({ serverFile, extensionKey: 'github', client })
    const removed = await removeFromServer({ serverFile, extensionKey: 'github', client })
    const content = await readFile(serverFile, 'utf-8')

    expect(removed).toBe('removed')
    expect(content).not.toContain('registerApi')
    expect(content).not.toContain('createGitHubClient')
    expect(content).not.toContain('@dashfy/ext-github')
    expect(content).toContain('dashfy.start()')
  })

  it('skips when the API is not registered', async () => {
    const serverFile = await makeServerFile()

    const removed = await removeFromServer({
      serverFile,
      extensionKey: 'github',
      client: { import: '@dashfy/ext-github', factory: 'createGitHubClient', mode: 'poll' },
    })

    expect(removed).toBe('skipped')
  })
})
