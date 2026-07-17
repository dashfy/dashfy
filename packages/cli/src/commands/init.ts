import { Command } from 'commander'
import fs from 'fs-extra'
import path from 'path'
import prompts from 'prompts'

import { DEFAULT_ENV_PATH, DEFAULT_PATHS } from '@/constants/paths'
import { setupExtension } from '@/core/setup-extension'
import { getRegistryIndex } from '@/registry/api'
import { resolveRegistryItems } from '@/registry/resolver'
import type { RegistryItem } from '@/schema'
import type { TemplateConfig } from '@/templates/index'
import { DEFAULT_TEMPLATE, getTemplate, listTemplateNames } from '@/templates/index'
import { scaffoldTemplate } from '@/utils/create-project'
import { loadEnvFiles } from '@/utils/env-loader'
import type { ResolvedConfig } from '@/utils/get-config'
import { CONFIG_FILE, resolveConfig, writeConfig } from '@/utils/get-config'
import { getPackageManager } from '@/utils/get-package-manager'
import { handleError } from '@/utils/handle-error'
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'
import { preflight } from '@/utils/preflight'
import { spinner } from '@/utils/spinner'
import { installAll } from '@/utils/updaters/install-deps'

interface InitOptions {
  cwd: string
  template?: string
  extensions?: string
  install: boolean
  yes: boolean
}

export const init = new Command()
  .name('init')
  .alias('create')
  .description('scaffold a new Dashfy app')
  .argument('[name]', 'project directory name')
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .option('-t, --template <template>', 'the template to use')
  .option('-e, --extensions <names>', 'comma-separated list of extensions to include')
  .option('--no-install', 'skip installing npm dependencies')
  .option('-y, --yes', 'skip confirmation prompts', false)
  .action(async (nameArg: string | undefined, options: InitOptions) => {
    try {
      await runInit(nameArg, options)
    } catch (error) {
      handleError(error)
    }
  })

export async function runInit(
  nameArg: string | undefined,
  options: InitOptions,
): Promise<{ projectName: string; targetDir: string }> {
  const cwd = path.resolve(options.cwd)
  await loadEnvFiles(cwd)
  const config = await resolveConfig(cwd)
  const template = resolveTemplate(options.template)
  const projectName = await resolveProjectName(nameArg, options, template)
  const targetDir = path.resolve(cwd, projectName)

  await assertEmptyTarget(targetDir)

  const items =
    template.kind === 'interactive'
      ? await resolveSelectedItems(await resolveExtensions(options, config), config)
      : []

  const copySpinner = spinner(`Creating project in ${highlighter.bold(targetDir)}`).start()
  try {
    await scaffoldTemplate({ templateDir: template.templateDir, projectPath: targetDir })
  } catch (error) {
    copySpinner.fail('Failed to create project')
    throw error
  }
  await rewritePackageJson(targetDir, projectName, items)
  await ensureEnvFile(targetDir)
  await ensureDashfyConfig(targetDir, config, template)
  copySpinner.succeed(`Created project in ${highlighter.bold(targetDir)}`)

  if (template.kind === 'interactive' && items.length > 0) {
    const project = await preflight(targetDir)
    for (const item of items) {
      const result = await setupExtension(project, item)
      logger.log(
        `  ${highlighter.success('+')} set up ${highlighter.bold(item.title)} ` +
          `(widgets: ${result.app}, server: ${result.server}, config: ${result.config}, env: ${result.env})`,
      )
    }
  }

  if (options.install) {
    const packageManager = await getPackageManager(targetDir)
    const installSpinner = spinner(`Installing dependencies with ${packageManager}`).start()
    try {
      await installAll(targetDir, packageManager)
      installSpinner.succeed('Installed dependencies')
    } catch (error) {
      installSpinner.fail('Failed to install dependencies')
      throw error
    }
  }

  printDone(projectName, items, options.install)

  return { projectName, targetDir }
}

function resolveTemplate(name: string | undefined): TemplateConfig {
  const templateName = name ?? DEFAULT_TEMPLATE
  const template = getTemplate(templateName)
  if (!template) {
    throw new Error(
      `Unknown template "${templateName}".\nAvailable: ${listTemplateNames().join(', ')}`,
    )
  }
  return template
}

async function resolveProjectName(
  nameArg: string | undefined,
  options: InitOptions,
  template: TemplateConfig,
): Promise<string> {
  if (nameArg) {
    return sanitizeName(nameArg)
  }
  if (options.yes) {
    return template.defaultProjectName
  }

  const response = (await prompts({
    type: 'text',
    name: 'name',
    message: 'What is your project named?',
    initial: template.defaultProjectName,
  })) as { name?: string }

  if (!response.name) {
    throw new Error('A project name is required.')
  }
  return sanitizeName(response.name)
}

function sanitizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function assertEmptyTarget(targetDir: string): Promise<void> {
  if (!(await fs.pathExists(targetDir))) {
    return
  }
  const entries = await fs.readdir(targetDir)
  if (entries.length > 0) {
    throw new Error(`Target directory ${targetDir} already exists and is not empty.`)
  }
}

async function resolveExtensions(options: InitOptions, config: ResolvedConfig): Promise<string[]> {
  if (options.extensions) {
    return options.extensions
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
  }
  if (options.yes) {
    return []
  }

  const index = await getRegistryIndex({ registries: config.registries })
  const response = (await prompts({
    type: 'multiselect',
    name: 'extensions',
    message: 'Which extensions would you like to include?',
    choices: index.items.map((item) => ({
      title: `${item.title} ${highlighter.dim(`(${item.name})`)}`,
      value: item.name,
    })),
    hint: '- Space to select. Return to submit',
  })) as { extensions?: string[] }

  return response.extensions ?? []
}

async function resolveSelectedItems(
  names: string[],
  config: ResolvedConfig,
): Promise<RegistryItem[]> {
  if (names.length === 0) {
    return []
  }
  return resolveRegistryItems(names, { registries: config.registries })
}

async function rewritePackageJson(
  targetDir: string,
  projectName: string,
  items: RegistryItem[],
): Promise<void> {
  const pkgPath = path.join(targetDir, 'package.json')
  const pkg = (await fs.readJson(pkgPath)) as {
    name: string
    dependencies?: Record<string, string>
  }

  pkg.name = projectName
  pkg.dependencies = pkg.dependencies ?? {}

  for (const item of items) {
    for (const dependency of item.dependencies) {
      const { name, range } = parseDependency(dependency)
      pkg.dependencies[name] = range
    }
  }

  pkg.dependencies = sortRecord(pkg.dependencies)
  await fs.writeJson(pkgPath, pkg, { spaces: 2 })
}

async function ensureEnvFile(targetDir: string): Promise<void> {
  const example = path.join(targetDir, '.env.example')
  const env = path.join(targetDir, DEFAULT_ENV_PATH)
  if ((await fs.pathExists(example)) && !(await fs.pathExists(env))) {
    await fs.copy(example, env)
  }
}

async function ensureDashfyConfig(
  targetDir: string,
  config: ResolvedConfig,
  template: TemplateConfig,
): Promise<void> {
  if (await fs.pathExists(path.join(targetDir, CONFIG_FILE))) {
    return
  }
  await writeConfig(targetDir, {
    registries: config.userRegistries,
    paths: { ...DEFAULT_PATHS, ...template.paths },
  })
}

function parseDependency(dependency: string): { name: string; range: string } {
  const lastAt = dependency.lastIndexOf('@')
  if (lastAt <= 0) {
    return { name: dependency, range: 'latest' }
  }
  return { name: dependency.slice(0, lastAt), range: dependency.slice(lastAt + 1) }
}

function sortRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))
}

function printDone(projectName: string, items: RegistryItem[], installed: boolean): void {
  logger.break()
  logger.success(`Created ${highlighter.bold(projectName)}.`)
  logger.break()
  logger.info('Next steps:')
  logger.log(`  cd ${projectName}`)
  if (!installed) {
    logger.log('  pnpm install')
  }

  const withEnv = items.filter((item) => item.envVars && item.envVars.length > 0)
  if (withEnv.length > 0) {
    logger.log('  # set the following in .env:')
    for (const item of withEnv) {
      logger.log(`    ${highlighter.bold(item.envVars?.join(', ') ?? '')}`)
    }
  } else {
    logger.log('  # review .env (copied from .env.example) for any required values')
  }

  logger.log('  pnpm dev:all')
  logger.break()
}
