import { describe, expect, it } from 'vitest'

import { getInstallArgs, getPackageRunner, getUninstallArgs } from '@/utils/get-package-manager'

describe('getInstallArgs', () => {
  it('uses install for npm and add for others', () => {
    expect(getInstallArgs('npm', ['dashfy'])).toEqual(['install', 'dashfy'])
    expect(getInstallArgs('pnpm', ['dashfy'])).toEqual(['add', 'dashfy'])
    expect(getInstallArgs('yarn', ['dashfy'])).toEqual(['add', 'dashfy'])
    expect(getInstallArgs('bun', ['dashfy'])).toEqual(['add', 'dashfy'])
  })

  it('adds dev and exact flags per manager', () => {
    expect(getInstallArgs('npm', ['dashfy@1.0.0'], { dev: true, exact: true })).toEqual([
      'install',
      '--save-dev',
      '--save-exact',
      'dashfy@1.0.0',
    ])
    expect(getInstallArgs('pnpm', ['dashfy@1.0.0'], { dev: true, exact: true })).toEqual([
      'add',
      '-D',
      '-E',
      'dashfy@1.0.0',
    ])
    expect(getInstallArgs('yarn', ['dashfy@1.0.0'], { dev: true, exact: true })).toEqual([
      'add',
      '--dev',
      '--exact',
      'dashfy@1.0.0',
    ])
    expect(getInstallArgs('bun', ['dashfy@1.0.0'], { dev: true, exact: true })).toEqual([
      'add',
      '-D',
      '--exact',
      'dashfy@1.0.0',
    ])
  })
})

describe('getUninstallArgs', () => {
  it('uses uninstall for npm and remove for others', () => {
    expect(getUninstallArgs('npm', ['@dashfy/ext-github'])).toEqual([
      'uninstall',
      '@dashfy/ext-github',
    ])
    expect(getUninstallArgs('pnpm', ['@dashfy/ext-github'])).toEqual([
      'remove',
      '@dashfy/ext-github',
    ])
    expect(getUninstallArgs('yarn', ['@dashfy/ext-github'])).toEqual([
      'remove',
      '@dashfy/ext-github',
    ])
    expect(getUninstallArgs('bun', ['@dashfy/ext-github'])).toEqual([
      'remove',
      '@dashfy/ext-github',
    ])
  })
})

describe('getPackageRunner', () => {
  it('maps each package manager to its one-off runner', () => {
    expect(getPackageRunner('pnpm')).toBe('pnpm dlx')
    expect(getPackageRunner('bun')).toBe('bunx')
    expect(getPackageRunner('npm')).toBe('npx')
    expect(getPackageRunner('yarn')).toBe('npx')
  })
})
