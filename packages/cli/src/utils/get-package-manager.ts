import fs from 'fs-extra'
import path from 'path'

import { CLI_NAME } from '@/constants/site'

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

/**
 * Detects the package manager for a project, preferring (in order):
 * 1. The `npm_config_user_agent` of the running process.
 * 2. A lockfile found in `cwd`.
 * 3. Falling back to `npm`.
 */
export async function getPackageManager(cwd: string): Promise<PackageManager> {
  const fromUserAgent = getPackageManagerFromUserAgent()
  if (fromUserAgent) {
    return fromUserAgent
  }

  if (await fs.pathExists(path.join(cwd, 'bun.lockb'))) {
    return 'bun'
  }
  if (await fs.pathExists(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (await fs.pathExists(path.join(cwd, 'yarn.lock'))) {
    return 'yarn'
  }

  return 'npm'
}

function getPackageManagerFromUserAgent(): PackageManager | undefined {
  const userAgent = process.env.npm_config_user_agent
  if (!userAgent) {
    return undefined
  }
  if (userAgent.startsWith('pnpm')) {
    return 'pnpm'
  }
  if (userAgent.startsWith('yarn')) {
    return 'yarn'
  }
  if (userAgent.startsWith('bun')) {
    return 'bun'
  }
  if (userAgent.startsWith('npm')) {
    return 'npm'
  }
  return undefined
}

/** Maps a package manager to its one-off runner (pnpm dlx / bunx / npx). */
export function getPackageRunner(packageManager: PackageManager): string {
  if (packageManager === 'pnpm') {
    return 'pnpm dlx'
  }
  if (packageManager === 'bun') {
    return 'bunx'
  }
  return 'npx'
}

/** Resolves the runner-prefixed Dashfy invocation for a project, e.g. `pnpm dlx dashfy@latest`. */
export async function getDashfyCliCommand(cwd: string): Promise<string> {
  return `${getPackageRunner(await getPackageManager(cwd))} ${CLI_NAME}@latest`
}

export interface InstallArgsOptions {
  /** Install as a devDependency. */
  dev?: boolean
  /** Pin the exact version (no `^`/`~` range). */
  exact?: boolean
}

/**
 * Returns the args used to install one or more packages with the given manager,
 * optionally as dev dependencies and/or pinned to exact versions.
 */
export function getInstallArgs(
  packageManager: PackageManager,
  packages: string[],
  options: InstallArgsOptions = {},
): string[] {
  const { dev, exact } = options
  const command = packageManager === 'npm' ? 'install' : 'add'
  const flags: string[] = []

  if (dev) {
    flags.push(packageManager === 'npm' ? '--save-dev' : packageManager === 'yarn' ? '--dev' : '-D')
  }
  if (exact) {
    flags.push(
      packageManager === 'npm'
        ? '--save-exact'
        : packageManager === 'yarn'
          ? '--exact'
          : packageManager === 'bun'
            ? '--exact'
            : '-E',
    )
  }

  return [command, ...flags, ...packages]
}

/**
 * Returns the args used to uninstall one or more packages with the given
 * manager.
 */
export function getUninstallArgs(packageManager: PackageManager, packages: string[]): string[] {
  const command = packageManager === 'npm' ? 'uninstall' : 'remove'
  return [command, ...packages]
}
