import fs from 'fs-extra'
import path from 'path'

import { DEFAULT_CONFIG_PATH, DEFAULT_SERVER_PATH } from '@/constants/paths'
import {
  deriveItemFromProject,
  extensionKeyFromAddress,
  isApiSetupInServer,
  isExtensionSetupInApp,
} from '@/core/derive-item'
import { getRegistryItem } from '@/registry/api'
import { BUILTIN_REGISTRY_NAMESPACE, EXTENSION_PACKAGE_PREFIX } from '@/registry/constants'
import type { ExtensionStarterWidget, RegistryItem } from '@/schema'
import { resolveConfig } from '@/utils/get-config'
import { getInstalledExtensions } from '@/utils/installed-extensions'
import type { DashfyProject } from '@/utils/preflight'
import { preflight } from '@/utils/preflight'
import { ensureRegistries } from '@/utils/registries'

/** Outcome of a single diagnostic check. */
export type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip'

export interface DoctorCheck {
  label: string
  status: CheckStatus
  detail?: string
}

export interface DoctorExtensionReport {
  address: string
  extensionKey: string
  checks: DoctorCheck[]
}

export interface DoctorReport {
  project: {
    appFile: string
    serverFile: string | null
    configFile: string | null
    envFile: string
  } | null
  extensions: DoctorExtensionReport[]
  general: DoctorCheck[]
  /** False when any check failed or no project was detected. */
  ok: boolean
}

export interface RunDoctorOptions {
  /** Limit checks to these extension addresses; defaults to installed extensions. */
  items?: string[]
}

/**
 * Diagnoses a Dashfy project: verifies that each extension is installed and set up
 * (app widgets, server API), that required env vars are set, and that starter
 * blocks exist. Returns a structured report; never prints or exits.
 */
export async function runDoctor(
  cwd: string,
  options: RunDoctorOptions = {},
): Promise<DoctorReport> {
  const general = buildGeneralChecks()

  let project: DashfyProject | null = null
  try {
    project = await preflight(cwd)
  } catch {
    project = null
  }

  if (!project) {
    general.unshift({
      label: 'Dashfy project detected',
      status: 'fail',
      detail: 'No Dashfy project found here. Run `dashfy init`, or pass --cwd to your project.',
    })
    return { project: null, extensions: [], general, ok: false }
  }

  const addresses = await resolveTargets(cwd, options.items)
  const dependencyNames = await readDependencyNames(cwd)
  const configContent = await readConfigContent(project.configFile)

  const extensions: DoctorExtensionReport[] = []
  for (const address of addresses) {
    const item = await resolveExpectedItem(cwd, project, address)
    extensions.push(buildExtensionReport(project, address, item, dependencyNames, configContent))
  }

  const ok =
    !general.some((check) => check.status === 'fail') &&
    extensions.every((extension) => extension.checks.every((check) => check.status !== 'fail'))

  return {
    project: {
      appFile: project.appFile,
      serverFile: project.serverFile ?? null,
      configFile: project.configFile ?? null,
      envFile: project.envFile,
    },
    extensions,
    general,
    ok,
  }
}

/** Resolves the set of extension addresses to check. */
async function resolveTargets(cwd: string, items?: string[]): Promise<string[]> {
  if (items?.length) {
    return dedupe(items)
  }
  const installed = await getInstalledExtensions(cwd)
  return dedupe(installed.map(packageToAddress))
}

/**
 * Resolves the expected registry item for an address. Falls back to parsing the
 * project (offline) so doctor still works when the registry is unreachable.
 */
async function resolveExpectedItem(
  cwd: string,
  project: DashfyProject,
  address: string,
): Promise<RegistryItem | null> {
  try {
    const config = await resolveConfig(cwd)
    const { registries } = await ensureRegistries([address], config, { cwd, persist: false })
    return await getRegistryItem(address, { registries, useCache: false })
  } catch {
    return deriveItemFromProject(project, address)
  }
}

function buildExtensionReport(
  project: DashfyProject,
  address: string,
  item: RegistryItem | null,
  dependencyNames: Set<string>,
  configContent: string | null,
): DoctorExtensionReport {
  const extensionKey = item?.meta.extensionKey ?? extensionKeyFromAddress(address)
  const checks: DoctorCheck[] = []

  if (!item) {
    checks.push({
      label: 'Resolve extension metadata',
      status: 'warn',
      detail: 'Could not resolve from the registry or project; running limited checks.',
    })
  }

  for (const dependency of item?.dependencies ?? []) {
    const name = packageNameWithoutVersion(dependency)
    const installed = dependencyNames.has(name)
    checks.push({
      label: `Dependency ${name} installed`,
      status: installed ? 'pass' : 'fail',
      detail: installed
        ? undefined
        : `Add ${name} to package.json (e.g. \`dashfy add ${address}\`).`,
    })
  }

  const appSetup = isExtensionSetupInApp(project, extensionKey)
  checks.push({
    label: `Widgets registered (WidgetRegistry.addExtension('${extensionKey}', ...))`,
    status: appSetup ? 'pass' : 'fail',
    detail: appSetup ? undefined : `Not found in ${toRelative(project.cwd, project.appFile)}.`,
  })

  if (item?.meta.client) {
    const apiSetup = isApiSetupInServer(project, extensionKey)
    checks.push({
      label: `Server API registered (dashfy.registerApi('${extensionKey}', ...))`,
      status: apiSetup ? 'pass' : 'fail',
      detail: apiSetup
        ? undefined
        : project.serverFile
          ? `Not found in ${toRelative(project.cwd, project.serverFile)}.`
          : `No server file detected (expected e.g. ${DEFAULT_SERVER_PATH}).`,
    })
  }

  for (const envVar of item?.envVars ?? []) {
    const isSet = Boolean(process.env[envVar])
    checks.push({
      label: `Environment variable ${envVar}`,
      status: isSet ? 'pass' : 'fail',
      detail: isSet ? 'detected' : `Set ${envVar} in ${toRelative(project.cwd, project.envFile)}.`,
    })
  }

  if (item?.meta.starter?.length) {
    const present = configMentionsStarter(configContent, item.meta.starter)
    checks.push({
      label: 'Starter dashboard block present',
      status: present ? 'pass' : 'warn',
      detail: present
        ? undefined
        : `No starter widget found in ${
            project.configFile ? toRelative(project.cwd, project.configFile) : DEFAULT_CONFIG_PATH
          }.`,
    })
  }

  if (item?.docs) {
    checks.push({ label: 'Review setup docs', status: 'skip', detail: item.docs })
  }

  return { address, extensionKey, checks }
}

/** Advisory checklist items that mirror the MCP audit's General section. */
function buildGeneralChecks(): DoctorCheck[] {
  return [
    { label: 'Run a type check (e.g. `pnpm typecheck`)', status: 'skip' },
    { label: 'Run the linter and fix any errors or warnings', status: 'skip' },
    { label: 'Start the dev server and confirm widgets render', status: 'skip' },
    { label: 'Ensure your .env file is not committed to version control', status: 'skip' },
  ]
}

/**
 * Maps an installed extension package name to its registry address. The registry
 * item name is the package name without the `ext-` prefix (see registry build),
 * e.g. `@dashfy/ext-github` -> `@dashfy/github`, `ext-github` -> `@dashfy/github`.
 */
export function packageToAddress(packageName: string): string {
  const scoped = /^(@[^/]+)\/(.+)$/.exec(packageName)
  const scope = scoped?.[1] ?? BUILTIN_REGISTRY_NAMESPACE
  const bare = (scoped?.[2] ?? packageName).replace(new RegExp(`^${EXTENSION_PACKAGE_PREFIX}`), '')
  return `${scope}/${bare}`
}

/** Strips the version range from a dependency spec (`@scope/pkg@^1.0.0` -> `@scope/pkg`). */
function packageNameWithoutVersion(spec: string): string {
  const at = spec.lastIndexOf('@')
  return at > 0 ? spec.slice(0, at) : spec
}

async function readDependencyNames(cwd: string): Promise<Set<string>> {
  const pkgPath = path.join(cwd, 'package.json')
  if (!(await fs.pathExists(pkgPath))) {
    return new Set()
  }
  try {
    const pkg = (await fs.readJson(pkgPath)) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    return new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ])
  } catch {
    return new Set()
  }
}

async function readConfigContent(configFile: string | undefined): Promise<string | null> {
  if (!configFile) {
    return null
  }
  try {
    return await fs.readFile(configFile, 'utf-8')
  } catch {
    return null
  }
}

function configMentionsStarter(
  configContent: string | null,
  starter: ExtensionStarterWidget[],
): boolean {
  if (!configContent) {
    return false
  }
  return starter.some((block) => configContent.includes(block.widget))
}

function toRelative(cwd: string, target: string): string {
  const relative = path.relative(cwd, target)
  return relative === '' ? target : relative
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)]
}
