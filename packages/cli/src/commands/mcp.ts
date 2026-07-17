import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { Command } from 'commander'
import fs from 'fs-extra'
import path from 'path'
import prompts from 'prompts'
import { z } from 'zod'

import { createMcpServer } from '@/mcp'
import { loadEnvFiles } from '@/utils/env-loader'
import { getPackageManager } from '@/utils/get-package-manager'
import { handleError } from '@/utils/handle-error'
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'
import { installDeps } from '@/utils/updaters/install-deps'

import packageJson from '../../package.json'

const SERVER_COMMAND = 'npx'

type ClientId = 'cursor' | 'claude' | 'vscode' | 'codex' | 'opencode'

/** How an MCP client should spawn the Dashfy server. */
interface Invocation {
  command: string
  args: string[]
}

interface JsonClient {
  id: Exclude<ClientId, 'codex'>
  name: string
  /** Config file path relative to the project root. */
  file: string
  /** Top-level key that holds the server map. */
  container: 'mcpServers' | 'servers' | 'mcp'
  /** Builds the server entry written under `<container>.dashfy`. */
  buildEntry: (invocation: Invocation) => Record<string, unknown>
  /** Extra top-level fields to ensure (e.g. $schema). */
  top?: Record<string, unknown>
}

const stdioEntry = (invocation: Invocation): Record<string, unknown> => ({
  command: invocation.command,
  args: invocation.args,
})

const JSON_CLIENTS: JsonClient[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    file: '.cursor/mcp.json',
    container: 'mcpServers',
    buildEntry: stdioEntry,
  },
  {
    id: 'claude',
    name: 'Claude',
    file: '.mcp.json',
    container: 'mcpServers',
    buildEntry: stdioEntry,
  },
  {
    id: 'vscode',
    name: 'VS Code',
    file: '.vscode/mcp.json',
    container: 'servers',
    buildEntry: stdioEntry,
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    file: 'opencode.json',
    container: 'mcp',
    buildEntry: (invocation) => ({
      type: 'local',
      command: [invocation.command, ...invocation.args],
      enabled: true,
    }),
    top: { $schema: 'https://opencode.ai/config.json' },
  },
]

const CLIENT_IDS = ['cursor', 'claude', 'vscode', 'codex', 'opencode'] as const

const mcpInitOptionsSchema = z.object({
  client: z.enum(CLIENT_IDS).optional(),
  install: z.boolean().optional(),
})

/**
 * Returns how clients should launch the server. By default this uses
 * `npx dashfy@latest`; with `--install` the CLI is pinned as a devDependency, so
 * clients invoke the locally installed `dashfy` binary instead.
 */
function buildInvocation(install: boolean): Invocation {
  return {
    command: SERVER_COMMAND,
    args: install ? ['dashfy', 'mcp'] : ['dashfy@latest', 'mcp'],
  }
}

export const mcp = new Command()
  .name('mcp')
  .description('run the Dashfy MCP server or configure an MCP client')
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .action(async (options: { cwd: string }) => {
    try {
      const cwd = path.resolve(options.cwd)
      await loadEnvFiles(cwd)
      const transport = new StdioServerTransport()
      await createMcpServer(cwd).connect(transport)
    } catch (error) {
      handleError(error)
    }
  })

mcp
  .command('init')
  .description('configure an MCP client to use the Dashfy server')
  .option('--client <client>', `MCP client (${CLIENT_IDS.join(', ')})`)
  .option(
    '--install',
    'install dashfy as a pinned devDependency and point the MCP config at the local CLI',
  )
  .action(async (opts: { client?: string; install?: boolean }, command: Command) => {
    try {
      const parentOpts = command.parent?.opts<{ cwd?: string }>() ?? {}
      const cwd = path.resolve(parentOpts.cwd ?? process.cwd())

      const { client, install } = mcpInitOptionsSchema.parse(opts)
      const selected = client ? [client] : await promptForClients()

      if (selected.length === 0) {
        logger.warn('No MCP client selected. Nothing to do.')
        return
      }

      const invocation = buildInvocation(Boolean(install))

      if (install) {
        await installPinnedCli(cwd)
      }

      for (const id of selected) {
        if (id === 'codex') {
          printCodexInstructions(invocation)
          continue
        }
        await writeJsonClient(cwd, id, invocation)
      }
    } catch (error) {
      handleError(error)
    }
  })

async function installPinnedCli(cwd: string): Promise<void> {
  const packageManager = await getPackageManager(cwd)
  const pkg = `dashfy@${packageJson.version}`
  await installDeps({ cwd, packageManager, packages: [pkg], dev: true, exact: true })
  logger.success(`Installed ${pkg} as a devDependency.`)
}

async function promptForClients(): Promise<ClientId[]> {
  const response = (await prompts({
    type: 'multiselect',
    name: 'clients',
    message: 'Which MCP clients would you like to configure?',
    choices: [
      { title: 'Cursor', value: 'cursor' },
      { title: 'Claude', value: 'claude' },
      { title: 'VS Code', value: 'vscode' },
      { title: 'Codex', value: 'codex' },
      { title: 'OpenCode', value: 'opencode' },
    ],
    hint: '- Space to select. Return to submit',
  })) as { clients?: ClientId[] }

  return response.clients ?? []
}

async function writeJsonClient(cwd: string, id: ClientId, invocation: Invocation): Promise<void> {
  const client = JSON_CLIENTS.find((candidate) => candidate.id === id)
  if (!client) {
    throw new Error(`Unsupported MCP client: ${id}`)
  }

  const filePath = path.join(cwd, client.file)
  await fs.ensureDir(path.dirname(filePath))

  const existing = await readJsonObject(filePath)
  const container = isObject(existing[client.container])
    ? (existing[client.container] as Record<string, unknown>)
    : {}

  const merged: Record<string, unknown> = {
    ...client.top,
    ...existing,
    [client.container]: { ...container, dashfy: client.buildEntry(invocation) },
  }

  await fs.writeFile(filePath, `${JSON.stringify(merged, null, 2)}\n`)
  logger.success(`Configured ${client.name} (${client.file}).`)
}

async function readJsonObject(filePath: string): Promise<Record<string, unknown>> {
  if (!(await fs.pathExists(filePath))) {
    return {}
  }
  try {
    const json = (await fs.readJson(filePath)) as unknown
    return isObject(json) ? json : {}
  } catch {
    throw new Error(`Existing config at ${filePath} is not valid JSON. Fix or remove it and retry.`)
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function printCodexInstructions(invocation: Invocation): void {
  logger.log(`Add the following to ${highlighter.info('~/.codex/config.toml')}:`)
  logger.break()
  logger.log('[mcp_servers.dashfy]')
  logger.log(`command = "${invocation.command}"`)
  logger.log(`args = [${invocation.args.map((arg) => `"${arg}"`).join(', ')}]`)
  logger.break()
}
