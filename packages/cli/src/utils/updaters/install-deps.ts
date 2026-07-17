import { execa } from 'execa'

import type { PackageManager } from '@/utils/get-package-manager'
import { getInstallArgs, getUninstallArgs } from '@/utils/get-package-manager'

export interface InstallDepsOptions {
  cwd: string
  packageManager: PackageManager
  packages: string[]
  /** Install as devDependencies. */
  dev?: boolean
  /** Pin the exact version (no semver range). */
  exact?: boolean
}

/**
 * Installs the given packages using the detected package manager.
 */
export async function installDeps(options: InstallDepsOptions): Promise<void> {
  const { cwd, packageManager, packages, dev, exact } = options
  if (packages.length === 0) {
    return
  }

  const args = getInstallArgs(packageManager, packages, { dev, exact })
  await execa(packageManager, args, { cwd, stdio: 'pipe' })
}

/**
 * Installs all dependencies declared in the project's package.json.
 */
export async function installAll(cwd: string, packageManager: PackageManager): Promise<void> {
  await execa(packageManager, ['install'], { cwd, stdio: 'pipe' })
}

export interface UninstallDepsOptions {
  cwd: string
  packageManager: PackageManager
  packages: string[]
}

/**
 * Uninstalls the given packages using the detected package manager.
 */
export async function uninstallDeps(options: UninstallDepsOptions): Promise<void> {
  const { cwd, packageManager, packages } = options
  if (packages.length === 0) {
    return
  }

  const args = getUninstallArgs(packageManager, packages)
  await execa(packageManager, args, { cwd, stdio: 'pipe' })
}
