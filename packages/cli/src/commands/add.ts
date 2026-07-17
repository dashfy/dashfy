import { Command } from 'commander'
import path from 'path'
import prompts from 'prompts'

import type { ApplyExtensionResult } from '@/core/apply-extension'
import { applyExtension } from '@/core/apply-extension'
import { getRegistryIndex } from '@/registry/api'
import { resolveRegistryItems } from '@/registry/resolver'
import type { RegistryItem } from '@/schema'
import { loadEnvFiles } from '@/utils/env-loader'
import type { ResolvedConfig } from '@/utils/get-config'
import { resolveConfig } from '@/utils/get-config'
import { getPackageManager } from '@/utils/get-package-manager'
import { handleError } from '@/utils/handle-error'
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'
import { preflight } from '@/utils/preflight'
import { ensureRegistries } from '@/utils/registries'
import { spinner } from '@/utils/spinner'

interface AddOptions {
  cwd: string
  install: boolean
  yes: boolean
  dryRun: boolean
}

export const add = new Command()
  .name('add')
  .description('add a Dashfy extension to your project')
  .argument(
    '[extensions...]',
    'extension address(es): name, @namespace/name, url, or owner/repo/name',
  )
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .option('--no-install', 'skip installing npm dependencies')
  .option('--dry-run', 'preview the changes without writing files', false)
  .option('-y, --yes', 'skip confirmation prompts', false)
  .action(async (extensionArgs: string[], options: AddOptions) => {
    try {
      const cwd = path.resolve(options.cwd)
      await loadEnvFiles(cwd)
      let config = await resolveConfig(cwd)

      const addresses = await resolveAddresses(extensionArgs, config)
      if (addresses.length === 0) {
        logger.warn('No extensions selected. Nothing to do.')
        return
      }

      config = await ensureNamespacesConfigured(addresses, config, cwd, options.yes)

      const resolveSpinner = spinner('Resolving extensions from registry').start()
      let items: RegistryItem[]
      try {
        items = await resolveRegistryItems(addresses, { registries: config.registries })
        resolveSpinner.succeed(`Resolved ${items.length} extension(s)`)
      } catch (error) {
        resolveSpinner.fail('Failed to resolve extensions')
        throw error
      }

      if (options.dryRun) {
        printDryRun(items)
        return
      }

      const project = await preflight(cwd)
      const packageManager = options.install ? await getPackageManager(cwd) : undefined

      for (const item of items) {
        logger.break()
        logger.info(`Adding ${highlighter.bold(item.title)} (${item.name})`)

        const applySpinner = options.install
          ? spinner(`Installing ${item.dependencies.join(', ')}`).start()
          : undefined
        try {
          const result = await applyExtension({ project, item, packageManager })
          applySpinner?.succeed(`Installed ${item.dependencies.join(', ')}`)
          reportResult(item, result)
        } catch (error) {
          applySpinner?.fail(`Failed to install ${item.dependencies.join(', ')}`)
          throw error
        }
      }

      printNextSteps(items)
    } catch (error) {
      handleError(error)
    }
  })

async function resolveAddresses(
  extensionArgs: string[],
  config: ResolvedConfig,
): Promise<string[]> {
  if (extensionArgs.length > 0) {
    return extensionArgs
  }

  const index = await getRegistryIndex({ registries: config.registries })
  const response = (await prompts({
    type: 'multiselect',
    name: 'extensions',
    message: 'Which extensions would you like to add?',
    choices: index.items.map((item) => ({
      title: `${item.title} ${highlighter.dim(`(${item.name})`)}`,
      value: item.name,
    })),
    hint: '- Space to select. Return to submit',
  })) as { extensions?: string[] }

  return response.extensions ?? []
}

/**
 * Ensures every referenced namespace is configured. Unknown namespaces are
 * resolved against the hosted discovery index and, with confirmation (or
 * `--yes`), written to `dashfy.json`. Namespaces missing from the index throw a
 * helpful error. Returns the (possibly refreshed) config.
 */
export async function ensureNamespacesConfigured(
  addresses: string[],
  config: ResolvedConfig,
  cwd: string,
  yes: boolean,
): Promise<ResolvedConfig> {
  const { registries, added } = await ensureRegistries(addresses, config, {
    cwd,
    persist: true,
    yes,
  })
  if (added.length === 0) {
    return config
  }
  return { ...config, registries }
}

function reportResult(item: RegistryItem, result: ApplyExtensionResult): void {
  const label = (step: string, value: string): string => {
    if (value === 'added') {
      return `${highlighter.success('+')} ${step}`
    }
    if (value === 'skipped') {
      return `${highlighter.dim('=')} ${step} (already present)`
    }
    return `${highlighter.dim('-')} ${step} (n/a)`
  }

  logger.log(`  ${label('widgets registered', result.app)}`)
  logger.log(`  ${label('server api registered', result.server)}`)
  logger.log(`  ${label('config dashboard', result.config)}`)
  logger.log(`  ${label('env variables', result.env)}`)
}

function printDryRun(items: RegistryItem[]): void {
  logger.break()
  logger.info('Dry run - the following extensions would be added:')
  for (const item of items) {
    logger.log(`  ${highlighter.bold(item.title)} (${item.name})`)
    logger.log(`    deps: ${item.dependencies.join(', ')}`)
    if (item.envVars && item.envVars.length > 0) {
      logger.log(`    env:  ${item.envVars.join(', ')}`)
    }
  }
  logger.break()
}

function printNextSteps(items: RegistryItem[]): void {
  const withEnv = items.filter((item) => item.envVars && item.envVars.length > 0)
  if (withEnv.length === 0) {
    return
  }

  logger.break()
  logger.info('Next steps:')
  for (const item of withEnv) {
    logger.log(`  - Set ${highlighter.bold(item.envVars?.join(', ') ?? '')} in your .env file.`)
    if (item.docs) {
      logger.log(`    ${highlighter.dim(item.docs)}`)
    }
  }
}
