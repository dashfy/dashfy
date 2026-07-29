import { Command } from 'commander'
import fs from 'fs-extra'
import path from 'path'
import { z } from 'zod'

import { DASHFY_SITE, REGISTRY_ITEM_SCHEMA_URL } from '@/constants/site'
import {
  EXTENSION_PACKAGE_PREFIX,
  NPM_REGISTRY_URL,
  REGISTRY_CATALOG_NAME,
  REGISTRY_INDEX_FILE,
} from '@/registry/constants'
import { fetchRemoteJson, readLocalJson } from '@/registry/fetcher'
import { isUrl } from '@/registry/utils'
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

/** The subset of an npm packument the registry build reads. */
interface NpmPackument {
  'dist-tags'?: Record<string, string | undefined>
  versions?: Record<string, ExtensionPackageJson | undefined>
}

/** Shape of the committed extension list consumed by `--from-npm`. */
const extensionListSchema = z.object({
  packages: z.array(z.string().min(1)).min(1),
})

export interface BuildRegistryOptions {
  /** Directory containing the `ext-*` packages to read metadata from. */
  packagesDir: string
  /** Directory to write the registry artifacts (`<name>.json` + `index.json`). */
  outputDir: string
}

export interface BuildRegistryFromNpmOptions {
  /** Fully qualified package names to read the `dashfy` metadata from. */
  packages: string[]
  /** Directory to write the registry artifacts (`<name>.json` + `index.json`). */
  outputDir: string
}

/** Maps an extension package.json and its `dashfy` metadata to a registry item. */
function toRegistryItem(pkg: ExtensionPackageJson, meta: ExtensionPackageMeta): RegistryItem {
  return registryItemSchema.parse({
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
}

/** Writes one item document per extension plus the catalog index. */
async function writeRegistryArtifacts(
  items: RegistryItem[],
  outputDir: string,
): Promise<{ count: number }> {
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
  await fs.writeJson(path.join(outputDir, REGISTRY_INDEX_FILE), index, { spaces: 2 })

  return { count: items.length }
}

/**
 * Reads the `dashfy` metadata field from each `ext-*` package directory and emits
 * the registry artifacts. Used for local authoring and for the CLI's own test
 * registry; packages without the metadata field are skipped with a warning.
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

    items.push(toRegistryItem(pkg, meta))
  }

  return writeRegistryArtifacts(items, outputDir)
}

/** Resolves where a package's packument is read from, honouring the env override. */
function resolvePackumentSource(packageName: string): string {
  const base = process.env.DASHFY_NPM_REGISTRY_URL ?? NPM_REGISTRY_URL

  return isUrl(base)
    ? `${base.replace(/\/+$/, '')}/${packageName.replace('/', '%2F')}`
    : path.join(base, `${packageName}.json`)
}

/**
 * Reads the `dashfy` metadata field of a published package's latest version.
 *
 * Extensions live in their own repositories, so npm is the source of truth for
 * the hosted registry: the metadata always matches what consumers install.
 */
async function fetchExtensionPackage(packageName: string): Promise<ExtensionPackageJson> {
  const source = resolvePackumentSource(packageName)
  const packument = (
    isUrl(source) ? await fetchRemoteJson(source, false) : await readLocalJson(source)
  ) as NpmPackument

  const latest = packument['dist-tags']?.latest
  if (!latest) {
    throw new Error(`${packageName} has no "latest" dist-tag on npm.`)
  }

  const pkg = packument.versions?.[latest]
  if (!pkg) {
    throw new Error(`${packageName}@${latest} is missing from the npm packument.`)
  }

  return pkg
}

/**
 * Builds the registry artifacts from the published `dashfy` metadata of each
 * listed package. Unlike the directory build this fails on the first bad
 * package, so a fetch error can never deploy a silently short catalog.
 */
export async function buildRegistryFromNpm(
  options: BuildRegistryFromNpmOptions,
): Promise<{ count: number }> {
  const { packages, outputDir } = options

  const items: RegistryItem[] = []

  for (const packageName of packages) {
    const pkg = await fetchExtensionPackage(packageName)
    const meta = pkg.dashfy
    if (!meta) {
      throw new Error(`${packageName}@${pkg.version} has no "dashfy" metadata field.`)
    }

    items.push(toRegistryItem(pkg, meta))
  }

  return writeRegistryArtifacts(items, outputDir)
}

/** Reads and validates the committed list of extension packages to publish. */
export async function readExtensionList(filePath: string): Promise<string[]> {
  const raw = (await fs.readJson(filePath)) as unknown
  const parsed = extensionListSchema.safeParse(raw)

  if (!parsed.success) {
    throw new Error(
      `${filePath} is not a valid extension list: expected { "packages": string[] }.\n${parsed.error.message}`,
    )
  }

  return parsed.data.packages
}

export const registryBuild = new Command()
  .name('build')
  .description('build the hosted registry artifacts from ext-* package metadata')
  .argument('[packages]', 'directory containing the ext-* packages', './packages')
  .option('-n, --from-npm <path>', 'build from published packages listed in a JSON file')
  .option('-o, --output <path>', 'destination directory for the registry json files')
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .action(
    async (packagesArg: string, options: { fromNpm?: string; output?: string; cwd: string }) => {
      try {
        const cwd = path.resolve(options.cwd)
        const outputDir = path.resolve(cwd, options.output ?? 'apps/registry/public/r')

        const { count } = options.fromNpm
          ? await buildRegistryFromNpm({
              packages: await readExtensionList(path.resolve(cwd, options.fromNpm)),
              outputDir,
            })
          : await buildRegistryFromPackages({
              packagesDir: path.resolve(cwd, packagesArg),
              outputDir,
            })

        logger.success(
          `Wrote ${highlighter.bold(String(count))} extension(s) to ${highlighter.bold(
            path.relative(cwd, outputDir),
          )}`,
        )
      } catch (error) {
        handleError(error)
      }
    },
  )

export type { Registry }
