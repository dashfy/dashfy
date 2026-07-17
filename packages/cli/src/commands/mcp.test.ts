import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import fs from 'fs-extra'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { installDeps } from '@/utils/updaters/install-deps'

import { mcp } from './mcp'

vi.mock('@/utils/updaters/install-deps', () => ({
  installDeps: vi.fn(() => Promise.resolve()),
}))

let cleanups: string[] = []

async function tmp(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'dashfy-mcp-init-'))
  cleanups.push(dir)
  return dir
}

async function runInit(cwd: string, client: string): Promise<void> {
  await mcp.parseAsync(['-c', cwd, 'init', '--client', client], { from: 'user' })
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(cleanups.map((dir) => fs.remove(dir).catch(() => undefined)))
  cleanups = []
})

describe('mcp init', () => {
  it('writes a Cursor config', async () => {
    const cwd = await tmp()
    await runInit(cwd, 'cursor')

    const config = await fs.readJson(path.join(cwd, '.cursor/mcp.json'))
    expect(config.mcpServers.dashfy).toEqual({ command: 'npx', args: ['dashfy@latest', 'mcp'] })
  })

  it('writes a Claude config', async () => {
    const cwd = await tmp()
    await runInit(cwd, 'claude')

    const config = await fs.readJson(path.join(cwd, '.mcp.json'))
    expect(config.mcpServers.dashfy.command).toBe('npx')
  })

  it('writes a VS Code config under servers', async () => {
    const cwd = await tmp()
    await runInit(cwd, 'vscode')

    const config = await fs.readJson(path.join(cwd, '.vscode/mcp.json'))
    expect(config.servers.dashfy.args).toEqual(['dashfy@latest', 'mcp'])
  })

  it('writes an OpenCode config with schema and local type', async () => {
    const cwd = await tmp()
    await runInit(cwd, 'opencode')

    const config = await fs.readJson(path.join(cwd, 'opencode.json'))
    expect(config.$schema).toBe('https://opencode.ai/config.json')
    expect(config.mcp.dashfy).toEqual({
      type: 'local',
      command: ['npx', 'dashfy@latest', 'mcp'],
      enabled: true,
    })
  })

  it('prints instructions for Codex without writing a file', async () => {
    const cwd = await tmp()
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      logs.push(String(message))
    })

    await runInit(cwd, 'codex')

    expect(logs.join('\n')).toContain('[mcp_servers.dashfy]')
    expect(await fs.pathExists(path.join(cwd, '.mcp.json'))).toBe(false)
  })

  it('with --install pins the local CLI and installs a dev dependency', async () => {
    const cwd = await tmp()
    await mcp.parseAsync(['-c', cwd, 'init', '--client', 'cursor', '--install'], { from: 'user' })

    const config = await fs.readJson(path.join(cwd, '.cursor/mcp.json'))
    expect(config.mcpServers.dashfy).toEqual({ command: 'npx', args: ['dashfy', 'mcp'] })

    expect(installDeps).toHaveBeenCalledTimes(1)
    const call = vi.mocked(installDeps).mock.calls[0]?.[0]
    expect(call?.dev).toBe(true)
    expect(call?.exact).toBe(true)
    expect(call?.packages[0]).toMatch(/^dashfy@/)
  })

  it('without --install does not install anything', async () => {
    const cwd = await tmp()
    await runInit(cwd, 'cursor')
    expect(installDeps).not.toHaveBeenCalled()
  })

  it('preserves existing servers when merging', async () => {
    const cwd = await tmp()
    await fs.ensureDir(path.join(cwd, '.cursor'))
    await fs.writeJson(path.join(cwd, '.cursor/mcp.json'), {
      mcpServers: { other: { command: 'node', args: ['server.js'] } },
    })

    await runInit(cwd, 'cursor')

    const config = await fs.readJson(path.join(cwd, '.cursor/mcp.json'))
    expect(config.mcpServers.other).toEqual({ command: 'node', args: ['server.js'] })
    expect(config.mcpServers.dashfy.command).toBe('npx')
  })
})
