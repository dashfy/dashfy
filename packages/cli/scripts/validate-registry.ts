/**
 * Validates the built Dashfy registry artifacts (per-extension `<name>.json` +
 * `index.json`) and the `registries.json` discovery index under
 * `apps/registry/public`, used as a pre-deploy gate in CI.
 *
 * Run with: `pnpm registry:validate`.
 */
import { fileURLToPath } from 'node:url'

import path from 'path'

import { validateRegistry } from '../src/registry/validate'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(scriptDir, '../../../apps/registry/public')
const dir = path.join(publicDir, 'r')
const registriesFile = path.join(publicDir, 'registries.json')

validateRegistry({ dir, registriesFile })
  .then((report) => {
    if (report.valid) {
      console.log(
        `Registry is valid: checked ${report.registryFiles} item file(s) and ${report.items} index entr${
          report.items === 1 ? 'y' : 'ies'
        }.`,
      )
      return
    }

    console.error('Registry validation failed:')
    for (const diagnostic of report.diagnostics) {
      const name = diagnostic.itemName ? ` "${diagnostic.itemName}"` : ''
      console.error(`  ${diagnostic.file}:${name} ${diagnostic.message}`)
      if (diagnostic.suggestion) {
        console.error(`    ${diagnostic.suggestion}`)
      }
    }
    process.exit(1)
  })
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
