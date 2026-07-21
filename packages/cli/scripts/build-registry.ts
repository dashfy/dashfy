/**
 * Builds the hosted Dashfy registry from each `@getdashfy/ext-*` package's `dashfy`
 * metadata field, writing per-extension item documents and an `index.json` to
 * the registry app at `apps/registry/public/r`.
 *
 * Run with: `pnpm registry:build` (also runs automatically before `build`).
 */
import { fileURLToPath } from 'node:url'

import path from 'path'

import { buildRegistryFromPackages } from '../src/commands/registry/build'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packagesDir = path.resolve(scriptDir, '../..')
const outputDir = path.resolve(scriptDir, '../../../apps/registry/public/r')

buildRegistryFromPackages({ packagesDir, outputDir })
  .then(({ count }) => {
    console.log(`Wrote ${count} extension(s) to ${path.relative(process.cwd(), outputDir)}`)
  })
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
