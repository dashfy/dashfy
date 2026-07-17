import type { SetupResult, TeardownResult } from '@/core/setup-extension'
import { setupExtension, stripVersion, teardownExtension } from '@/core/setup-extension'
import type { RegistryItem } from '@/schema'
import type { PackageManager } from '@/utils/get-package-manager'
import type { DashfyProject } from '@/utils/preflight'
import { installDeps, uninstallDeps } from '@/utils/updaters/install-deps'

export interface ApplyExtensionOptions {
  project: DashfyProject
  item: RegistryItem
  /** When provided, the extension's npm dependencies are installed. */
  packageManager?: PackageManager
}

export interface ApplyExtensionResult extends SetupResult {
  installed: boolean
}

/**
 * Applies a resolved registry item to a project: installs its npm dependencies
 * (optional) and sets it up in the app, server, config, and env. Setup is
 * idempotent, so re-applying an extension is safe.
 */
export async function applyExtension(
  options: ApplyExtensionOptions,
): Promise<ApplyExtensionResult> {
  const { project, item, packageManager } = options

  let installed = false
  if (packageManager) {
    await installDeps({ cwd: project.cwd, packageManager, packages: item.dependencies })
    installed = true
  }

  const result = await setupExtension(project, item)
  return { ...result, installed }
}

export interface UnapplyExtensionOptions {
  project: DashfyProject
  item: RegistryItem
  /** When provided, the extension's npm dependencies are uninstalled. */
  packageManager?: PackageManager
}

export interface UnapplyExtensionResult extends TeardownResult {
  uninstalled: boolean
}

/**
 * Reverses {@link applyExtension}: tears the extension down from the app, server,
 * config, and env, then (optionally) uninstalls its npm dependencies. Teardown
 * is idempotent, so removing an absent extension is safe.
 */
export async function unapplyExtension(
  options: UnapplyExtensionOptions,
): Promise<UnapplyExtensionResult> {
  const { project, item, packageManager } = options

  const result = await teardownExtension(project, item)

  let uninstalled = false
  if (packageManager) {
    const packages = item.dependencies.map(stripVersion)
    await uninstallDeps({ cwd: project.cwd, packageManager, packages })
    uninstalled = true
  }

  return { ...result, uninstalled }
}
