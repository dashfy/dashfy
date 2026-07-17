import { CLI_NAME } from '@/constants/site'
import { BUILTIN_REGISTRY_NAMESPACE } from '@/registry/constants'
import type { SearchResults } from '@/registry/search'
import type {
  ExtensionClient,
  ExtensionStarterWidget,
  RegistryConfig,
  RegistryItem,
} from '@/schema'

/** Returns the install address for an item (`@dashfy/<name>` for bare names). */
export function itemAddress(item: Pick<RegistryItem, 'name'>): string {
  return item.name.startsWith('@') ? item.name : `${BUILTIN_REGISTRY_NAMESPACE}/${item.name}`
}

/** Flattens a registry config to `@namespace -> url` string pairs. */
function flattenRegistries(registries: RegistryConfig): [string, string][] {
  return Object.entries(registries).map(([namespace, value]) => [
    namespace,
    typeof value === 'string' ? value : value.url,
  ])
}

/** Bullet list of configured registries, for `get_project_registries`. */
export function formatRegistryNames(registries: RegistryConfig): string {
  const entries = flattenRegistries(registries)
  if (entries.length === 0) {
    return 'No registries are configured. The built-in @dashfy registry is always available.'
  }
  const lines = entries.map(([namespace, url]) => `- ${namespace} -> ${url}`)
  return `Configured registries:\n${lines.join('\n')}`
}

/** Human-readable, grouped search/list output for the MCP tools. */
export function formatSearchResults(
  results: SearchResults,
  context: { query?: string; registries?: string[]; offset?: number; command?: string } = {},
): string {
  const shown = results.results.reduce((sum, group) => sum + group.items.length, 0)
  const offset = context.offset ?? 0
  const command = context.command ?? CLI_NAME
  const sections: string[] = []

  if (shown === 0) {
    const suffix = context.query ? ` for "${context.query}"` : ''
    sections.push(`No items found${suffix}.`)
  } else {
    sections.push(`Found ${shown} item${shown === 1 ? '' : 's'}:`)
    for (const group of results.results) {
      if (group.items.length === 0) {
        continue
      }
      const lines = group.items.map((item) => {
        const description = item.description ? ` - ${item.description}` : ''
        return `  - ${itemAddress(item)} (${item.title})${description}\n    Add: ${command} add ${itemAddress(item)}`
      })
      const total = group.total ?? group.items.length
      const nextOffset = offset + group.items.length
      if (total > nextOffset) {
        lines.push(
          `  … ${total - nextOffset} more in ${group.registry} — use offset: ${nextOffset}`,
        )
      }
      sections.push(`${group.registry}\n${lines.join('\n')}`)
    }
  }

  if (results.errors && results.errors.length > 0) {
    const failures = results.errors.map((error) => `  - ${error.registry}: ${error.message}`)
    sections.push(`Skipped registries:\n${failures.join('\n')}`)
  }

  return sections.join('\n\n')
}

/** Detailed, readable rendering of full registry items, for `view`. */
export function formatRegistryItems(items: RegistryItem[]): string {
  if (items.length === 0) {
    return 'No items found.'
  }
  return items.map(formatRegistryItem).join('\n\n---\n\n')
}

function formatRegistryItem(item: RegistryItem): string {
  const lines: string[] = [`# ${itemAddress(item)}`, `Title: ${item.title}`, `Type: ${item.type}`]

  if (item.description) {
    lines.push(`Description: ${item.description}`)
  }
  if (item.categories?.length) {
    lines.push(`Categories: ${item.categories.join(', ')}`)
  }

  lines.push(`Dependencies: ${item.dependencies.join(', ')}`)

  if (item.registryDependencies?.length) {
    lines.push(`Registry dependencies: ${item.registryDependencies.join(', ')}`)
  }
  if (item.envVars?.length) {
    lines.push(`Environment variables: ${item.envVars.join(', ')}`)
  }

  lines.push(`Widgets: ${item.meta.widgets.join(', ')}`)
  lines.push(`Extension key: ${item.meta.extensionKey}`)

  if (item.meta.client) {
    lines.push(
      `Server client: ${item.meta.client.factory} from ${item.meta.client.import} (${item.meta.client.mode})`,
    )
  }
  if (item.meta.starter?.length) {
    lines.push(`Starter widgets: ${item.meta.starter.length}`)
  }
  if (item.docs) {
    lines.push(`Docs: ${item.docs}`)
  }

  return lines.join('\n')
}

/** Structured, setup-oriented documentation for a single extension. */
export interface ExtensionDocs {
  /** Install address, e.g. `@dashfy/github`. */
  address: string
  name: string
  title: string
  description?: string
  categories?: string[]
  /** Author-provided setup text / URL (`item.docs`), when present. */
  setup?: string
  /** Environment variables the extension needs. */
  envVars?: string[]
  /** How the extension integrates into the app and (optionally) the server. */
  integration: {
    extensionKey: string
    widgets: string[]
    client?: ExtensionClient
  }
  /** Starter dashboard blocks seeded by `dashfy add`. */
  starter?: ExtensionStarterWidget[]
  dependencies: string[]
  registryDependencies?: string[]
  /** Ready-to-run install command. */
  addCommand: string
}

/** Builds the structured docs payload for an extension item. */
export function buildExtensionDocs(
  item: RegistryItem,
  options: { command?: string } = {},
): ExtensionDocs {
  const command = options.command ?? CLI_NAME
  const docs: ExtensionDocs = {
    address: itemAddress(item),
    name: item.name,
    title: item.title,
    integration: {
      extensionKey: item.meta.extensionKey,
      widgets: item.meta.widgets,
    },
    dependencies: item.dependencies,
    addCommand: `${command} add ${itemAddress(item)}`,
  }

  if (item.description) {
    docs.description = item.description
  }
  if (item.categories?.length) {
    docs.categories = item.categories
  }
  if (item.docs) {
    docs.setup = item.docs
  }
  if (item.envVars?.length) {
    docs.envVars = item.envVars
  }
  if (item.meta.client) {
    docs.integration.client = item.meta.client
  }
  if (item.meta.starter?.length) {
    docs.starter = item.meta.starter
  }
  if (item.registryDependencies?.length) {
    docs.registryDependencies = item.registryDependencies
  }

  return docs
}

/** Renders one starter block as `WidgetName (prop: value, ...)`. */
function formatStarterWidget(starter: ExtensionStarterWidget): string {
  const { widget, ...rest } = starter
  const props = Object.entries(rest)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join(', ')
  return props ? `${widget} (${props})` : widget
}

/** Human-readable, setup-oriented docs for the `dashfy docs` command. */
export function formatExtensionDocs(
  items: RegistryItem[],
  options: { command?: string } = {},
): string {
  if (items.length === 0) {
    return 'No items found.'
  }

  return items
    .map((item) => {
      const docs = buildExtensionDocs(item, options)
      const sections: string[] = []

      const heading = docs.description
        ? `${docs.address} — ${docs.title}\n${docs.description}`
        : `${docs.address} — ${docs.title}`
      sections.push(heading)

      if (docs.setup) {
        sections.push(`Setup\n  ${docs.setup}`)
      }

      if (docs.envVars?.length) {
        sections.push(`Environment\n  ${docs.envVars.join(', ')}`)
      }

      const integrationLines = [
        `  Extension key: ${docs.integration.extensionKey}`,
        `  Widgets: ${docs.integration.widgets.join(', ')}`,
      ]
      if (docs.integration.client) {
        const { factory, import: from, mode, options } = docs.integration.client
        integrationLines.push(`  Server: ${factory} from ${from} (${mode})`)
        if (options) {
          integrationLines.push(`  Options: ${options}`)
        }
      }
      sections.push(`Integration\n${integrationLines.join('\n')}`)

      if (docs.starter?.length) {
        const lines = docs.starter.map((starter) => `  - ${formatStarterWidget(starter)}`)
        sections.push(`Starter dashboard\n${lines.join('\n')}`)
      }

      sections.push(`Install\n  ${docs.addCommand}`)

      return sections.join('\n\n')
    })
    .join('\n\n---\n\n')
}

/** Returns the `dashfy add` commands (and variants) for the given items. */
export function formatAddCommands(
  items: RegistryItem[],
  options: { command?: string } = {},
): string {
  if (items.length === 0) {
    return 'No items to add.'
  }
  const command = options.command ?? CLI_NAME
  const addresses = items.map(itemAddress).join(' ')
  return [
    `Install and set up the extension(s):`,
    `  ${command} add ${addresses}`,
    ``,
    `Preview without writing files:`,
    `  ${command} add ${addresses} --dry-run`,
    ``,
    `Configure only (skip npm install):`,
    `  ${command} add ${addresses} --no-install`,
  ].join('\n')
}
