import { Command } from 'commander'
import path from 'path'

import type { CheckStatus, DoctorCheck, DoctorReport } from '@/core/doctor'
import { runDoctor } from '@/core/doctor'
import { clearRegistryContext } from '@/registry/context'
import { loadEnvFiles } from '@/utils/env-loader'
import { handleError } from '@/utils/handle-error'
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'
import { isJson } from '@/utils/output'

interface DoctorOptions {
  cwd: string
  json: boolean
}

export const doctor = new Command()
  .name('doctor')
  .description('diagnose a Dashfy project: verify extension setup, env vars, and config')
  .argument('[extensions...]', 'limit checks to specific extension address(es)')
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .option('--json', 'output as JSON', false)
  .action(async (extensions: string[], options: DoctorOptions) => {
    try {
      const cwd = path.resolve(options.cwd)
      await loadEnvFiles(cwd)

      const report = await runDoctor(cwd, {
        items: extensions.length > 0 ? extensions : undefined,
      })

      if (isJson() || options.json) {
        logger.data(JSON.stringify(report, null, 2))
      } else {
        printDoctorReport(report)
      }

      if (!report.ok) {
        process.exitCode = 1
      }
    } catch (error) {
      handleError(error)
    } finally {
      clearRegistryContext()
    }
  })

function statusMark(status: CheckStatus): string {
  switch (status) {
    case 'pass':
      return highlighter.success('✓')
    case 'fail':
      return highlighter.error('✗')
    case 'warn':
      return highlighter.warn('!')
    case 'skip':
      return highlighter.dim('○')
  }
}

function printCheck(check: DoctorCheck): void {
  const detail = check.detail ? ` ${highlighter.dim(`— ${check.detail}`)}` : ''
  logger.log(`  ${statusMark(check.status)} ${check.label}${detail}`)
}

function printDoctorReport(report: DoctorReport): void {
  logger.log(highlighter.bold('Dashfy Doctor'))
  logger.break()

  if (report.project) {
    logger.log(highlighter.info('Project'))
    logger.log(`  app    ${report.project.appFile}`)
    logger.log(`  server ${report.project.serverFile ?? '-'}`)
    logger.log(`  config ${report.project.configFile ?? '-'}`)
    logger.log(`  env    ${report.project.envFile}`)
    logger.break()
  }

  if (report.extensions.length === 0 && report.project) {
    logger.log(highlighter.info('Extensions'))
    logger.log('  No extensions detected. Install one with `dashfy add <extension>`.')
    logger.break()
  }

  for (const extension of report.extensions) {
    logger.log(highlighter.info(extension.address))
    for (const check of extension.checks) {
      printCheck(check)
    }
    logger.break()
  }

  logger.log(highlighter.info('General'))
  for (const check of report.general) {
    printCheck(check)
  }
  logger.break()

  printSummary(report)
}

function printSummary(report: DoctorReport): void {
  const checks = [...report.general, ...report.extensions.flatMap((extension) => extension.checks)]
  const passed = checks.filter((check) => check.status === 'pass').length
  const failed = checks.filter((check) => check.status === 'fail').length
  const warnings = checks.filter((check) => check.status === 'warn').length

  const summary = `${passed} passed, ${failed} failed, ${warnings} warning${
    warnings === 1 ? '' : 's'
  }`

  if (report.ok) {
    logger.log(`${highlighter.success('✓')} ${summary}`)
  } else {
    logger.log(`${highlighter.error('✗')} ${summary}`)
  }
}
