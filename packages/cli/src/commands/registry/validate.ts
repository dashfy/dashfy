import { Command } from 'commander'
import path from 'path'

import type { RegistryValidationDiagnostic, RegistryValidationReport } from '@/registry/validate'
import { validateRegistry } from '@/registry/validate'
import { handleError } from '@/utils/handle-error'
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'
import { isJson } from '@/utils/output'
import { spinner } from '@/utils/spinner'

interface ValidateOptions {
  cwd: string
  registries?: string
  json: boolean
}

export const registryValidate = new Command()
  .name('validate')
  .description('validate a built registry directory (index.json + {name}.json files)')
  .argument('[dir]', 'directory containing the built registry artifacts', 'apps/registry/public/r')
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .option('--registries <path>', 'also validate a registries.json discovery file')
  .option('--json', 'output the report as JSON', false)
  .action(async (dirArg: string, options: ValidateOptions) => {
    try {
      const cwd = path.resolve(options.cwd)
      const dir = path.resolve(cwd, dirArg)
      const registriesFile = options.registries ? path.resolve(cwd, options.registries) : undefined

      const json = isJson() || options.json
      const validationSpinner = json ? undefined : spinner('Validating registry').start()

      const report = await validateRegistry({ dir, registriesFile })

      if (json) {
        logger.data(JSON.stringify(report, null, 2))
      } else {
        printValidationReport(report, validationSpinner)
      }

      if (!report.valid) {
        process.exitCode = 1
      }
    } catch (error) {
      handleError(error)
    }
  })

function printValidationReport(
  report: RegistryValidationReport,
  validationSpinner?: ReturnType<typeof spinner>,
): void {
  const stats = `Checked ${formatCount(report.registryFiles, 'item file', 'item files')} and ${formatCount(
    report.items,
    'index entry',
    'index entries',
  )}.`

  if (report.valid) {
    validationSpinner?.succeed('Registry is valid.')
    logger.log(`  ${stats}`)
    return
  }

  validationSpinner?.fail('Registry validation failed.')
  logger.log(`  ${stats}`)
  logger.break()

  for (const [file, diagnostics] of groupDiagnostics(report.diagnostics)) {
    logger.log(highlighter.info(file))
    for (const diagnostic of diagnostics) {
      logger.error(`  - ${formatDiagnostic(diagnostic)}`)
      if (diagnostic.suggestion) {
        logger.log(`    ${highlighter.dim(diagnostic.suggestion)}`)
      }
    }
    logger.break()
  }
}

function groupDiagnostics(
  diagnostics: RegistryValidationDiagnostic[],
): Map<string, RegistryValidationDiagnostic[]> {
  const groups = new Map<string, RegistryValidationDiagnostic[]>()
  for (const diagnostic of diagnostics) {
    const group = groups.get(diagnostic.file) ?? []
    group.push(diagnostic)
    groups.set(diagnostic.file, group)
  }
  return groups
}

function formatDiagnostic(diagnostic: RegistryValidationDiagnostic): string {
  const context: string[] = []
  if (diagnostic.itemName) {
    context.push(`"${diagnostic.itemName}"`)
  }
  if (context.length === 0) {
    return diagnostic.message
  }
  return `${context.join(' ')}: ${diagnostic.message}`
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
