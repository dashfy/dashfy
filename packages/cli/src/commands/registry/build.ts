import { Command } from 'commander'
import fs from 'fs-extra'
import path from 'path'

import { DASHFY_SITE, REGISTRY_ITEM_SCHEMA_URL } from '@/constants/site'
import { EXTENSION_PACKAGE_PREFIX, REGISTRY_CATALOG_NAME } from '@/registry/constants'
import type { ExtensionClient, ExtensionStarterWidget, Registry, RegistryItem } from '@/schema'
import { registryIndexSchema, registryItemSchema } from '@/schema'
import { handleError } from '@/utils/handle-error'
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'

/** The `dashfy` metadata field authored in each extension's package.json. */
interface ExtensionPackageMeta {
  id: string
  title: string
  description?: string
  categories?: string[]
  docs?: string
  widgets: string[]
  client?: ExtensionClient
  envVars?: string[]
  starter?: ExtensionStarterWidget[]
  registryDependencies?: string[]
}

interface ExtensionPackageJson {
  name: string
  version: string
  description?: string
  dashfy?: ExtensionPackageMeta
}

export interface BuildRegistryOptions {
  /** Directory containing the `ext-*` packages to read metadata from. */
  packagesDir: string
  /** Directory to write the registry artifacts (`<name>.json` + `index.json`). */
  outputDir: string
}

/**
 * Reads the `dashfy` metadata field from each `ext-*` package and emits the
 * hosted registry artifacts: one item document per extension plus an index.
 */
export async function buildRegistryFromPackages(
  options: BuildRegistryOptions,
): Promise<{ count: number }> {
  const { packagesDir, outputDir } = options

  const entries = await fs.readdir(packagesDir, { withFileTypes: true })
  const extensionDirs = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(EXTENSION_PACKAGE_PREFIX))
    .map((entry) => path.join(packagesDir, entry.name))
    .sort()

  const items: RegistryItem[] = []

  for (const dir of extensionDirs) {
    const pkgPath = path.join(dir, 'package.json')
    if (!(await fs.pathExists(pkgPath))) {
      continue
    }

    const pkg = (await fs.readJson(pkgPath)) as ExtensionPackageJson
    const meta = pkg.dashfy
    if (!meta) {
      logger.warn(`Skipping ${pkg.name}: no "dashfy" metadata field.`)
      continue
    }

    const item = registryItemSchema.parse({
      $schema: REGISTRY_ITEM_SCHEMA_URL,
      name: meta.id,
      type: 'registry:extension',
      title: meta.title,
      description: meta.description ?? pkg.description,
      dependencies: [`${pkg.name}@^${pkg.version}`],
      registryDependencies: meta.registryDependencies,
      envVars: meta.envVars,
      categories: meta.categories,
      docs: meta.docs,
      meta: {
        extensionKey: meta.id,
        widgets: meta.widgets,
        client: meta.client,
        starter: meta.starter,
      },
    } satisfies RegistryItem)

    items.push(item)
  }

  items.sort((a, b) => a.name.localeCompare(b.name))

  await fs.ensureDir(outputDir)
  for (const item of items) {
    await fs.writeJson(path.join(outputDir, `${item.name}.json`), item, { spaces: 2 })
  }

  const index = registryIndexSchema.parse({
    name: REGISTRY_CATALOG_NAME,
    homepage: DASHFY_SITE,
    items: items.map((item) => ({
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description,
      categories: item.categories,
    })),
  })
  await fs.writeJson(path.join(outputDir, 'index.json'), index, { spaces: 2 })

  return { count: items.length }
}

export const registryBuild = new Command()
  .name('build')
  .description('build the hosted registry artifacts from ext-* package metadata')
  .argument('[packages]', 'directory containing the ext-* packages', './packages')
  .option('-o, --output <path>', 'destination directory for the registry json files')
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .action(async (packagesArg: string, options: { output?: string; cwd: string }) => {
    try {
      const cwd = path.resolve(options.cwd)
      const packagesDir = path.resolve(cwd, packagesArg)
      const outputDir = path.resolve(cwd, options.output ?? 'apps/registry/public/r')

      const { count } = await buildRegistryFromPackages({ packagesDir, outputDir })
      logger.success(
        `Wrote ${highlighter.bold(String(count))} extension(s) to ${highlighter.bold(
          path.relative(cwd, outputDir),
        )}`,
      )
    } catch (error) {
      handleError(error)
    }
  })

export type { Registry }
