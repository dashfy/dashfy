import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { DEFAULT_APP_PATH, DEFAULT_CONFIG_PATH } from '@/constants/paths'
import {
  formatAddCommands,
  formatExtensionDocs,
  formatRegistryItems,
  formatRegistryNames,
  formatSearchResults,
} from '@/mcp/format'
import { getRegistryItems } from '@/registry/api'
import { clearRegistryContext } from '@/registry/context'
import { RegistryError } from '@/registry/errors'
import { resolveRegistryItems } from '@/registry/resolver'
import { findUnknownTypes, SEARCHABLE_TYPES, searchRegistries } from '@/registry/search'
import type { RegistryItem } from '@/schema'
import { loadEnvFiles } from '@/utils/env-loader'
import type { ResolvedConfig } from '@/utils/get-config'
import { resolveConfig } from '@/utils/get-config'
import { getDashfyCliCommand } from '@/utils/get-package-manager'
import { preflight } from '@/utils/preflight'
import { ensureRegistries } from '@/utils/registries'

import packageJson from '../../package.json'

const TYPES_HINT = `One of: ${SEARCHABLE_TYPES.join(', ')}.`

const listInputSchema = z.object({
  registries: z
    .array(z.string())
    .optional()
    .describe('Registry namespaces to query (e.g. @dashfy). Defaults to all configured.'),
  types: z.array(z.string()).optional().describe(`Filter by item type. ${TYPES_HINT}`),
  limit: z.number().optional().describe('Maximum items per registry (default 100).'),
  offset: z.number().optional().describe('Number of items to skip for pagination.'),
})

const searchInputSchema = listInputSchema.extend({
  query: z
    .string()
    .describe('Search text matched against name, title, description, and categories.'),
})

const itemsInputSchema = z.object({
  items: z
    .array(z.string())
    .describe('Item addresses, e.g. @dashfy/github, github, owner/repo/item, or a URL.'),
})

const auditInputSchema = z.object({
  items: z
    .array(z.string())
    .optional()
    .describe('Recently added extension addresses to produce targeted checks for.'),
})

/** Loads env files (for `${ENV}` auth) then resolves the merged registry config. */
async function getMcpConfig(cwd: string): Promise<ResolvedConfig> {
  await loadEnvFiles(cwd)
  return resolveConfig(cwd)
}

export async function getProjectRegistries(cwd: string): Promise<string> {
  const config = await resolveConfig(cwd)
  return formatRegistryNames(config.registries)
}

export async function listItems(
  cwd: string,
  args: z.infer<typeof listInputSchema>,
): Promise<string> {
  return runSearch(cwd, args)
}

export async function searchItems(
  cwd: string,
  args: z.infer<typeof searchInputSchema>,
): Promise<string> {
  return runSearch(cwd, args, args.query)
}

async function runSearch(
  cwd: string,
  args: z.infer<typeof listInputSchema>,
  query?: string,
): Promise<string> {
  if (args.types?.length) {
    const unknown = findUnknownTypes(args.types)
    if (unknown.length > 0) {
      throw new Error(
        `Unknown type(s): ${unknown.join(', ')}. Valid types: ${SEARCHABLE_TYPES.join(', ')}.`,
      )
    }
  }

  const config = await getMcpConfig(cwd)
  const explicit = Boolean(args.registries?.length)
  let registries = config.registries
  let namespaces: string[]

  if (explicit) {
    const requested = args.registries ?? []
    const ensured = await ensureRegistries(
      requested.map((registry) => `${registry}/index`),
      config,
      { cwd, persist: false },
    )
    registries = ensured.registries
    namespaces = requested
  } else {
    namespaces = Object.keys(config.registries)
  }

  const results = await searchRegistries(namespaces, {
    query,
    types: args.types,
    limit: args.limit ?? 100,
    offset: args.offset,
    registries,
    continueOnError: !explicit,
  })

  const command = await getDashfyCliCommand(cwd)
  return formatSearchResults(results, {
    query,
    registries: namespaces,
    offset: args.offset ?? 0,
    command,
  })
}

export async function viewItems(cwd: string, items: string[]): Promise<string> {
  const config = await getMcpConfig(cwd)
  const { registries } = await ensureRegistries(items, config, { cwd, persist: false })
  const resolved = await getRegistryItems(items, { registries })
  return formatRegistryItems(resolved)
}

export async function getAddCommand(cwd: string, items: string[]): Promise<string> {
  const config = await getMcpConfig(cwd)
  const { registries } = await ensureRegistries(items, config, { cwd, persist: false })
  const resolved = await getRegistryItems(items, { registries })
  const command = await getDashfyCliCommand(cwd)
  return formatAddCommands(resolved, { command })
}

export async function getDocsForItems(cwd: string, items: string[]): Promise<string> {
  const config = await getMcpConfig(cwd)
  const { registries } = await ensureRegistries(items, config, { cwd, persist: false })
  const resolved = await getRegistryItems(items, { registries })
  const command = await getDashfyCliCommand(cwd)
  return formatExtensionDocs(resolved, { command })
}

/**
 * Produces a post-install checklist for a Dashfy project. When `items` are
 * given, the checklist includes concrete per-extension checks (env vars, server
 * setup, starter blocks); otherwise it falls back to generic guidance.
 */
export async function buildAuditChecklist(cwd: string, items?: string[]): Promise<string> {
  const config = await getMcpConfig(cwd)

  let project: Awaited<ReturnType<typeof preflight>> | null = null
  try {
    project = await preflight(cwd)
  } catch {
    project = null
  }

  const sections: string[] = ['## Dashfy Extension Audit Checklist', '']

  if (!project) {
    sections.push(
      'No Dashfy project was detected in this directory.',
      '',
      '- [ ] Run `dashfy init` to scaffold a project, or change to your project directory.',
    )
  }

  let resolved: RegistryItem[] = []
  if (items?.length) {
    const { registries } = await ensureRegistries(items, config, { cwd, persist: false })
    resolved = await resolveRegistryItems(items, { registries })
  }

  for (const item of resolved) {
    const checks: string[] = [`### ${item.name}`]

    checks.push(`- [ ] Ensure ${item.dependencies.join(', ')} are installed.`)
    checks.push(
      `- [ ] Verify WidgetRegistry.addExtension('${item.meta.extensionKey}', { ${item.meta.widgets.join(
        ', ',
      )} }) in ${project?.appFile ?? `your app file (e.g. ${DEFAULT_APP_PATH})`}.`,
    )

    for (const envVar of item.envVars ?? []) {
      const isSet = Boolean(process.env[envVar])
      const status = isSet ? 'x' : ' '
      checks.push(`- [${status}] Set ${envVar} in .env${isSet ? ' (detected)' : ''}.`)
    }

    if (item.meta.client) {
      checks.push(
        `- [ ] Verify dashfy.registerApi('${item.meta.extensionKey}', ...) is set up in ${
          project?.serverFile ?? 'your server bootstrap file'
        }.`,
      )
    }

    if (item.meta.starter?.length) {
      checks.push(
        `- [ ] Verify the starter widget(s) exist in ${
          project?.configFile ?? DEFAULT_CONFIG_PATH
        }.`,
      )
    }

    if (item.docs) {
      checks.push(`- [ ] Review setup docs: ${item.docs}`)
    }

    sections.push(checks.join('\n'))
  }

  sections.push(
    '### General',
    [
      '- [ ] Run a type check (e.g. `pnpm typecheck`).',
      '- [ ] Run the linter and fix any errors or warnings.',
      '- [ ] Start the dev server and confirm widgets render.',
      '- [ ] Ensure your .env file is not committed to version control.',
    ].join('\n'),
  )

  return sections.join('\n\n')
}

/**
 * Builds a Dashfy MCP server bound to `cwd`. Tool output is always text; the
 * server speaks JSON-RPC over stdio, so handlers never write to stdout.
 */
export function createMcpServer(cwd: string): Server {
  const server = new Server(
    { name: 'dashfy', version: packageJson.version },
    { capabilities: { tools: {} } },
  )

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: [
      {
        name: 'get_project_registries',
        description:
          'List the registries configured for this project (from dashfy.json plus the built-in @dashfy).',
        inputSchema: zodToJsonSchema(z.object({})),
      },
      {
        name: 'list_items_in_registries',
        description: `List available extensions across registries. ${TYPES_HINT}`,
        inputSchema: zodToJsonSchema(listInputSchema),
      },
      {
        name: 'search_items_in_registries',
        description: `Search for extensions across registries by text query. ${TYPES_HINT}`,
        inputSchema: zodToJsonSchema(searchInputSchema),
      },
      {
        name: 'view_items_in_registries',
        description:
          'View full details for one or more extensions (dependencies, env vars, widgets, setup metadata).',
        inputSchema: zodToJsonSchema(itemsInputSchema),
      },
      {
        name: 'get_docs_for_items',
        description:
          'Get setup-oriented docs for extensions: author setup notes, env vars, setup, starter blocks, and a ready-to-run install command. Use this instead of view_items_in_registries when guiding installation.',
        inputSchema: zodToJsonSchema(itemsInputSchema),
      },
      {
        name: 'get_add_command_for_items',
        description: 'Get the `dashfy add` command (and variants) to install the given extensions.',
        inputSchema: zodToJsonSchema(itemsInputSchema),
      },
      {
        name: 'get_audit_checklist',
        description:
          'Get a post-install checklist for the current Dashfy project (env vars, server setup, starter blocks).',
        inputSchema: zodToJsonSchema(auditInputSchema),
      },
    ],
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const text = await dispatchTool(cwd, request.params.name, request.params.arguments)
      return { content: [{ type: 'text' as const, text }] }
    } catch (error) {
      return { content: [{ type: 'text' as const, text: formatError(error) }], isError: true }
    } finally {
      clearRegistryContext()
    }
  })

  return server
}

async function dispatchTool(cwd: string, name: string, args: unknown): Promise<string> {
  switch (name) {
    case 'get_project_registries':
      return getProjectRegistries(cwd)
    case 'list_items_in_registries':
      return listItems(cwd, listInputSchema.parse(args ?? {}))
    case 'search_items_in_registries':
      return searchItems(cwd, searchInputSchema.parse(args ?? {}))
    case 'view_items_in_registries':
      return viewItems(cwd, itemsInputSchema.parse(args ?? {}).items)
    case 'get_docs_for_items':
      return getDocsForItems(cwd, itemsInputSchema.parse(args ?? {}).items)
    case 'get_add_command_for_items':
      return getAddCommand(cwd, itemsInputSchema.parse(args ?? {}).items)
    case 'get_audit_checklist':
      return buildAuditChecklist(cwd, auditInputSchema.parse(args ?? {}).items)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

function formatError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return `Invalid arguments:\n${error.errors
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')}`
  }
  if (error instanceof RegistryError) {
    const suggestion = error.suggestion ? `\nSuggestion: ${error.suggestion}` : ''
    return `${error.message}${suggestion}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
