import { Command } from 'commander'
import path from 'path'
import prompts from 'prompts'

import { RegistryInvalidNamespaceError } from '@/registry/errors'
import type { RegistryConfig } from '@/schema'
import { loadEnvFiles } from '@/utils/env-loader'
import { removeRegistries, resolveConfig } from '@/utils/get-config'
import { handleError } from '@/utils/handle-error'
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'

interface RegistryRemoveOptions {
  cwd: string
  yes: boolean
  silent: boolean
}

export const registryRemove = new Command()
  .name('remove')
  .alias('rm')
  .description('remove custom registries from your dashfy.json')
  .argument('[registries...]', 'registry namespace(s) to remove, e.g. @acme')
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .option('-y, --yes', 'skip confirmation prompts', false)
  .option('-s, --silent', 'mute output', false)
  .action(async (registryArgs: string[], options: RegistryRemoveOptions) => {
    try {
      const cwd = path.resolve(options.cwd)
      await loadEnvFiles(cwd)
      const config = await resolveConfig(cwd)
      const userRegistries = config.userRegistries ?? {}

      const namespaces =
        registryArgs.length > 0
          ? registryArgs.map(parseNamespace)
          : await promptForRegistries(userRegistries)

      if (namespaces.length === 0) {
        if (!options.silent) {
          logger.warn('No registries selected. Nothing to do.')
        }
        return
      }

      if (!options.yes && !options.silent) {
        const confirmed = await confirmRemoval(namespaces)
        if (!confirmed) {
          logger.warn('Aborted. Nothing was removed.')
          return
        }
      }

      const { removed, missing } = await removeRegistries(cwd, namespaces)

      if (!options.silent) {
        reportRegistryChanges(removed, missing, userRegistries)
      }
    } catch (error) {
      handleError(error)
    }
  })

/** Validates and returns a `@namespace` argument. */
function parseNamespace(arg: string): string {
  const namespace = arg.trim()
  if (!namespace.startsWith('@')) {
    throw new RegistryInvalidNamespaceError(namespace)
  }
  return namespace
}

async function promptForRegistries(userRegistries: RegistryConfig): Promise<string[]> {
  const namespaces = Object.keys(userRegistries)
  if (namespaces.length === 0) {
    logger.warn('No custom registries are configured in dashfy.json.')
    return []
  }

  const response = (await prompts({
    type: 'multiselect',
    name: 'registries',
    message: 'Which registries would you like to remove?',
    choices: namespaces.map((namespace) => ({
      title: `${namespace} ${highlighter.dim(`-> ${registryUrl(userRegistries[namespace])}`)}`,
      value: namespace,
    })),
    hint: '- Space to select. Return to submit',
  })) as { registries?: string[] }

  return response.registries ?? []
}

async function confirmRemoval(namespaces: string[]): Promise<boolean> {
  const response = (await prompts({
    type: 'confirm',
    name: 'value',
    message: `Remove ${namespaces.join(', ')} from dashfy.json?`,
    initial: false,
  })) as { value?: boolean }

  return Boolean(response.value)
}

/** Returns the URL template for a registry config entry (string or object form). */
function registryUrl(entry: RegistryConfig[string] | undefined): string {
  if (!entry) {
    return ''
  }
  return typeof entry === 'string' ? entry : entry.url
}

function reportRegistryChanges(
  removed: string[],
  missing: string[],
  previous: RegistryConfig,
): void {
  if (removed.length > 0) {
    logger.success(
      `Removed ${removed.length} registr${removed.length === 1 ? 'y' : 'ies'} from dashfy.json:`,
    )
    for (const namespace of removed) {
      logger.log(
        `  ${highlighter.success('-')} ${namespace} ${highlighter.dim(
          `-> ${registryUrl(previous[namespace])}`,
        )}`,
      )
    }
  }

  if (missing.length > 0) {
    logger.info(`Not configured (skipped): ${missing.join(', ')}`)
  }

  if (removed.length === 0 && missing.length === 0) {
    logger.info('No registries to remove.')
  }
}
