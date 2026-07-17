import { Command } from 'commander'
import path from 'path'

import { CONFIG_SCHEMA_URL, DOCS_URL } from '@/constants/site'
import { REGISTRY_URL } from '@/registry/constants'
import { resolveRegistriesIndexUrl } from '@/registry/discovery'
import type { RegistryConfig } from '@/schema'
import { loadEnvFiles } from '@/utils/env-loader'
import { getConfig, resolveConfig } from '@/utils/get-config'
import { handleError } from '@/utils/handle-error'
import { highlighter } from '@/utils/highlighter'
import { getInstalledExtensions } from '@/utils/installed-extensions'
import { logger } from '@/utils/logger'
import { isJson } from '@/utils/output'
import { preflight } from '@/utils/preflight'

interface InfoOptions {
  cwd: string
  json: boolean
}

interface DashfyInfo {
  project: {
    cwd: string
    appFile: string
    serverFile: string | null
    configFile: string | null
    envFile: string
  } | null
  config: {
    paths: Record<string, string | undefined> | null
    registries: Record<string, string>
  }
  installedExtensions: string[]
  links: Record<string, string>
}

export const info = new Command()
  .name('info')
  .description('print information about the current Dashfy project')
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .option('--json', 'output as JSON', false)
  .action(async (options: InfoOptions) => {
    try {
      const cwd = path.resolve(options.cwd)
      await loadEnvFiles(cwd)
      const data = await collectInfo(cwd)

      if (isJson() || options.json) {
        logger.data(JSON.stringify(data, null, 2))
        return
      }

      printInfo(data)
    } catch (error) {
      handleError(error)
    }
  })

export async function collectInfo(cwd: string): Promise<DashfyInfo> {
  let project: DashfyInfo['project'] = null
  try {
    const detected = await preflight(cwd)
    project = {
      cwd: detected.cwd,
      appFile: detected.appFile,
      serverFile: detected.serverFile ?? null,
      configFile: detected.configFile ?? null,
      envFile: detected.envFile,
    }
  } catch {
    // Not a Dashfy project (or not detectable); config/links still apply.
  }

  const config = await getConfig(cwd)
  const resolved = await resolveConfig(cwd)

  return {
    project,
    config: {
      paths: config?.paths ?? null,
      registries: flattenRegistries(resolved.registries),
    },
    installedExtensions: await getInstalledExtensions(cwd),
    links: {
      docs: DOCS_URL,
      registry: REGISTRY_URL,
      registries: resolveRegistriesIndexUrl(),
      schema: CONFIG_SCHEMA_URL,
    },
  }
}

function flattenRegistries(registries: RegistryConfig): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [namespace, value] of Object.entries(registries)) {
    result[namespace] = typeof value === 'string' ? value : value.url
  }
  return result
}

function printInfo(data: DashfyInfo): void {
  logger.log(highlighter.info('Project'))
  if (data.project) {
    printEntries({
      cwd: data.project.cwd,
      app: data.project.appFile,
      server: data.project.serverFile ?? '-',
      config: data.project.configFile ?? '-',
      env: data.project.envFile,
    })
  } else {
    logger.log('  No Dashfy project detected.')
  }

  logger.break()
  logger.log(highlighter.info('Configuration'))
  if (data.config.paths) {
    printEntries({
      app: data.config.paths.app ?? '-',
      server: data.config.paths.server ?? '-',
      config: data.config.paths.config ?? '-',
      env: data.config.paths.env ?? '-',
    })
  } else {
    logger.log('  No path overrides configured (using defaults).')
  }

  logger.break()
  logger.log(highlighter.info('Registries'))
  printEntries(data.config.registries)

  logger.break()
  logger.log(highlighter.info('Installed Extensions'))
  if (data.installedExtensions.length > 0) {
    logger.log(`  ${data.installedExtensions.join(', ')}`)
  } else {
    logger.log('  No extensions installed.')
  }

  logger.break()
  logger.log(highlighter.info('Links'))
  printEntries(data.links)
  logger.break()
}

function printEntries(entries: Record<string, string>): void {
  const keys = Object.keys(entries)
  if (keys.length === 0) {
    return
  }
  const maxKeyLength = Math.max(...keys.map((key) => key.length))
  for (const [key, value] of Object.entries(entries)) {
    logger.log(`  ${key.padEnd(maxKeyLength + 2)}${value}`)
  }
}
