import { Command } from 'commander'
import path from 'path'
import { z } from 'zod'

import { clearRegistryContext } from '@/registry/context'
import {
  findUnknownTypes,
  printSearchResults,
  SEARCHABLE_TYPES,
  searchRegistries,
} from '@/registry/search'
import { loadEnvFiles } from '@/utils/env-loader'
import { resolveConfig } from '@/utils/get-config'
import { getDashfyCliCommand } from '@/utils/get-package-manager'
import { handleError } from '@/utils/handle-error'
import { logger } from '@/utils/logger'
import { isJson } from '@/utils/output'
import { ensureRegistries } from '@/utils/registries'

interface SearchRawOptions {
  cwd: string
  query?: string
  type?: string
  limit?: string
  offset?: string
  json?: boolean
}

const searchOptionsSchema = z.object({
  cwd: z.string(),
  query: z.string().optional(),
  types: z.array(z.string()).optional(),
  limit: z.number().int().nonnegative().optional(),
  offset: z.number().int().nonnegative().optional(),
  json: z.boolean(),
})

export const search = new Command()
  .name('search')
  .alias('list')
  .description('search extensions across registries')
  .argument('[registries...]', 'registry namespace(s) to search (defaults to all configured)')
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .option('-q, --query <query>', 'filter items by name, title, description, or category')
  .option('-t, --type <type>', 'filter by item type (comma-separated)')
  .option('-l, --limit <number>', 'maximum number of items per registry', '100')
  .option('-o, --offset <number>', 'number of items to skip', '0')
  .option('--json', 'output as JSON', false)
  .action(async (registries: string[], opts: SearchRawOptions) => {
    try {
      const options = searchOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        query: opts.query,
        types: opts.type
          ? opts.type
              .split(',')
              .map((type) => type.trim())
              .filter(Boolean)
          : undefined,
        limit: opts.limit !== undefined ? Number.parseInt(opts.limit, 10) : undefined,
        offset: opts.offset !== undefined ? Number.parseInt(opts.offset, 10) : undefined,
        json: Boolean(opts.json),
      })

      if (options.types?.length) {
        const unknown = findUnknownTypes(options.types)
        if (unknown.length > 0) {
          throw new Error(
            `Unknown type(s): ${unknown.join(', ')}. Valid types: ${SEARCHABLE_TYPES.join(', ')}.`,
          )
        }
      }

      await loadEnvFiles(options.cwd)
      const config = await resolveConfig(options.cwd)

      const explicit = registries.length > 0
      let registryConfig = config.registries
      let namespaces: string[]

      if (explicit) {
        const invalid = registries.filter((registry) => !registry.startsWith('@'))
        if (invalid.length > 0) {
          throw new Error(
            `Invalid registr${invalid.length === 1 ? 'y' : 'ies'}: ${invalid.join(
              ', ',
            )}. Use an @namespace, e.g. @getdashfy.`,
          )
        }
        const ensured = await ensureRegistries(
          registries.map((registry) => `${registry}/index`),
          config,
          { cwd: options.cwd, persist: false },
        )
        registryConfig = ensured.registries
        namespaces = registries
      } else {
        namespaces = Object.keys(config.registries)
      }

      const results = await searchRegistries(namespaces, {
        query: options.query,
        types: options.types,
        limit: options.limit,
        offset: options.offset,
        registries: registryConfig,
        continueOnError: !explicit,
      })

      if (isJson() || options.json) {
        logger.data(JSON.stringify(results, null, 2))
      } else {
        const command = await getDashfyCliCommand(options.cwd)
        printSearchResults(results, {
          query: options.query,
          types: options.types,
          offset: options.offset,
          command,
        })
      }

      const allFailed =
        !explicit && namespaces.length > 0 && (results.errors?.length ?? 0) === namespaces.length
      process.exitCode = allFailed ? 1 : 0
    } catch (error) {
      handleError(error)
    } finally {
      clearRegistryContext()
    }
  })
