import { Command } from 'commander'
import path from 'path'
import prompts from 'prompts'

import type { UnapplyExtensionResult } from '@/core/apply-extension'
import { unapplyExtension } from '@/core/apply-extension'
import { deriveItemFromProject } from '@/core/derive-item'
import { resolveRegistryItems } from '@/registry/resolver'
import type { RegistryItem } from '@/schema'
import { loadEnvFiles } from '@/utils/env-loader'
import { resolveConfig } from '@/utils/get-config'
import { getPackageManager } from '@/utils/get-package-manager'
import { handleError } from '@/utils/handle-error'
import { highlighter } from '@/utils/highlighter'
import { getInstalledExtensions } from '@/utils/installed-extensions'
import { logger } from '@/utils/logger'
import type { DashfyProject } from '@/utils/preflight'
import { preflight } from '@/utils/preflight'
import { spinner } from '@/utils/spinner'

interface RemoveOptions {
  cwd: string
  keepDeps: boolean
  dryRun: boolean
  yes: boolean
}

export const remove = new Command()
  .name('remove')
  .alias('rm')
  .description('remove a Dashfy extension from your project')
  .argument(
    '[extensions...]',
    'extension address(es): name, @namespace/name, url, or owner/repo/name',
  )
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .option('--keep-deps', 'leave npm dependencies installed', false)
  .option('--dry-run', 'preview the changes without writing files', false)
  .option('-y, --yes', 'skip confirmation prompts', false)
  .action(async (extensionArgs: string[], options: RemoveOptions) => {
    try {
      const cwd = path.resolve(options.cwd)
      await loadEnvFiles(cwd)
      const config = await resolveConfig(cwd)
      const project = await preflight(cwd)

      const addresses = await resolveAddresses(extensionArgs, cwd)
      if (addresses.length === 0) {
        logger.warn('No extensions selected. Nothing to do.')
        return
      }

      const items = await resolveItems(addresses, config.registries, project)
      if (items.length === 0) {
        logger.warn('No matching extensions found to remove.')
        return
      }

      if (options.dryRun) {
        printDryRun(items, options.keepDeps)
        return
      }

      if (!options.yes) {
        const confirmed = await confirmRemoval(items)
        if (!confirmed) {
          logger.warn('Aborted. Nothing was removed.')
          return
        }
      }

      const packageManager = options.keepDeps ? undefined : await getPackageManager(cwd)

      for (const item of items) {
        logger.break()
        logger.info(`Removing ${highlighter.bold(item.title)} (${item.name})`)

        const removeSpinner =
          packageManager && item.dependencies.length > 0
            ? spinner(`Uninstalling ${item.dependencies.join(', ')}`).start()
            : undefined
        try {
          const result = await unapplyExtension({ project, item, packageManager })
          removeSpinner?.succeed(`Uninstalled ${item.dependencies.join(', ')}`)
          reportResult(item, result)
        } catch (error) {
          removeSpinner?.fail(`Failed to uninstall ${item.dependencies.join(', ')}`)
          throw error
        }
      }
    } catch (error) {
      handleError(error)
    }
  })

async function resolveAddresses(extensionArgs: string[], cwd: string): Promise<string[]> {
  if (extensionArgs.length > 0) {
    return extensionArgs
  }

  const installed = await getInstalledExtensions(cwd)
  if (installed.length === 0) {
    logger.warn('No installed extensions detected in package.json.')
    return []
  }

  const response = (await prompts({
    type: 'multiselect',
    name: 'extensions',
    message: 'Which extensions would you like to remove?',
    choices: installed.map((name) => ({ title: name, value: name })),
    hint: '- Space to select. Return to submit',
  })) as { extensions?: string[] }

  return response.extensions ?? []
}

/**
 * Resolves addresses to registry items (registry-first). When the registry
 * cannot be reached, falls back to reconstructing each item from the project so
 * removal still works offline.
 */
async function resolveItems(
  addresses: string[],
  registries: Awaited<ReturnType<typeof resolveConfig>>['registries'],
  project: DashfyProject,
): Promise<RegistryItem[]> {
  try {
    return await resolveRegistryItems(addresses, { registries })
  } catch {
    logger.warn('Could not reach the registry. Deriving removal from the project.')
    const derived: RegistryItem[] = []
    for (const address of addresses) {
      const item = deriveItemFromProject(project, address)
      if (item) {
        derived.push(item)
      } else {
        logger.warn(`Could not find ${highlighter.bold(address)} set up in the project. Skipping.`)
      }
    }
    return derived
  }
}

async function confirmRemoval(items: RegistryItem[]): Promise<boolean> {
  const names = items.map((item) => item.name).join(', ')
  const response = (await prompts({
    type: 'confirm',
    name: 'value',
    message: `Remove ${names} from your project?`,
    initial: false,
  })) as { value?: boolean }

  return Boolean(response.value)
}

function reportResult(item: RegistryItem, result: UnapplyExtensionResult): void {
  const label = (step: string, value: string): string => {
    if (value === 'removed') {
      return `${highlighter.success('-')} ${step}`
    }
    if (value === 'skipped') {
      return `${highlighter.dim('=')} ${step} (not present)`
    }
    return `${highlighter.dim('-')} ${step} (n/a)`
  }

  logger.log(`  ${label('widgets unregistered', result.app)}`)
  logger.log(`  ${label('server api unregistered', result.server)}`)
  logger.log(`  ${label('config dashboard', result.config)}`)
  logger.log(`  ${label('env variables', result.env)}`)
  if (result.uninstalled) {
    logger.log(`  ${highlighter.success('-')} dependencies uninstalled`)
  }

  if (result.keptEnvVars.length > 0) {
    logger.break()
    logger.info(
      `Kept ${highlighter.bold(result.keptEnvVars.join(', '))} in .env (still has a value). Remove manually if no longer needed.`,
    )
  }
}

function printDryRun(items: RegistryItem[], keepDeps: boolean): void {
  logger.break()
  logger.info('Dry run - the following extensions would be removed:')
  for (const item of items) {
    logger.log(`  ${highlighter.bold(item.title)} (${item.name})`)
    if (!keepDeps && item.dependencies.length > 0) {
      logger.log(`    deps: ${item.dependencies.join(', ')}`)
    }
    if (item.envVars && item.envVars.length > 0) {
      logger.log(`    env:  ${item.envVars.join(', ')} (only empty placeholders are removed)`)
    }
  }
  logger.break()
}
