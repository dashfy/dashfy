import { Command } from 'commander'
import path from 'path'
import prompts from 'prompts'

import { fetchRegistriesIndex, resolveNamespaceUrl } from '@/registry/discovery'
import { RegistryInvalidNamespaceError } from '@/registry/errors'
import { loadEnvFiles } from '@/utils/env-loader'
import { addRegistries, resolveConfig } from '@/utils/get-config'
import { handleError } from '@/utils/handle-error'
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'

interface RegistryAddOptions {
  cwd: string
  yes: boolean
  silent: boolean
}

export const registryAdd = new Command()
  .name('add')
  .description('add custom registries to your dashfy.json')
  .argument(
    '[registries...]',
    'registry namespace(s): @acme (resolved from the index) or @acme=https://acme.com/r/{name}.json',
  )
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .option('-y, --yes', 'skip confirmation prompts', false)
  .option('-s, --silent', 'mute output', false)
  .action(async (registryArgs: string[], options: RegistryAddOptions) => {
    try {
      const cwd = path.resolve(options.cwd)
      await loadEnvFiles(cwd)
      const config = await resolveConfig(cwd)

      const args = registryArgs.length > 0 ? registryArgs : await promptForRegistries()
      if (args.length === 0) {
        if (!options.silent) {
          logger.warn('No registries selected. Nothing to do.')
        }
        return
      }

      const toAdd: Record<string, string> = {}
      const skipped: string[] = []

      for (const arg of args) {
        const { namespace, url } = parseRegistryArg(arg)
        if (config.userRegistries?.[namespace] || toAdd[namespace]) {
          skipped.push(namespace)
          continue
        }

        const resolvedUrl = url ?? (await resolveNamespaceUrl(namespace))
        if (!resolvedUrl) {
          throw new Error(
            `Registry ${highlighter.info(namespace)} was not found in the discovery index.\n` +
              `Provide its URL explicitly, e.g. ${namespace}=https://example.com/r/{name}.json`,
          )
        }
        toAdd[namespace] = resolvedUrl
      }

      if (Object.keys(toAdd).length > 0) {
        await addRegistries(cwd, toAdd)
      }

      if (!options.silent) {
        reportRegistryChanges(toAdd, skipped)
      }
    } catch (error) {
      handleError(error)
    }
  })

/** Parses a `@namespace` or `@namespace=url` argument into its parts. */
function parseRegistryArg(arg: string): { namespace: string; url?: string } {
  const separator = arg.indexOf('=')
  const namespace = (separator === -1 ? arg : arg.slice(0, separator)).trim()
  if (!namespace.startsWith('@')) {
    throw new RegistryInvalidNamespaceError(namespace)
  }

  const url = separator === -1 ? '' : arg.slice(separator + 1).trim()
  if (url !== '' && !url.includes('{name}')) {
    throw new Error(`Registry URL for ${namespace} must include the {name} placeholder.`)
  }

  return { namespace, url: url === '' ? undefined : url }
}

async function promptForRegistries(): Promise<string[]> {
  let choices: { title: string; description?: string; value: string }[] = []
  try {
    const index = await fetchRegistriesIndex()
    choices = Object.entries(index.registries).map(([namespace, entry]) => ({
      title: entry.name ? `${namespace} ${highlighter.dim(`(${entry.name})`)}` : namespace,
      description: entry.description,
      value: namespace,
    }))
  } catch {
    // Discovery index unavailable; fall back to manual entry below.
  }

  if (choices.length === 0) {
    const response = (await prompts({
      type: 'text',
      name: 'registry',
      message: 'Enter a registry (e.g. @acme=https://acme.com/r/{name}.json):',
    })) as { registry?: string }
    return response.registry ? [response.registry] : []
  }

  const response = (await prompts({
    type: 'multiselect',
    name: 'registries',
    message: 'Which registries would you like to add?',
    choices,
    hint: '- Space to select. Return to submit',
  })) as { registries?: string[] }

  return response.registries ?? []
}

function reportRegistryChanges(added: Record<string, string>, skipped: string[]): void {
  const addedKeys = Object.keys(added)

  if (addedKeys.length > 0) {
    logger.success(
      `Added ${addedKeys.length} registr${addedKeys.length === 1 ? 'y' : 'ies'} to dashfy.json:`,
    )
    for (const namespace of addedKeys) {
      logger.log(
        `  ${highlighter.success('+')} ${namespace} ${highlighter.dim(`-> ${added[namespace]}`)}`,
      )
    }
  }

  if (skipped.length > 0) {
    logger.info(`Skipped ${skipped.length} already configured: ${skipped.join(', ')}`)
  }

  if (addedKeys.length === 0 && skipped.length === 0) {
    logger.info('No registries to add.')
  }
}
