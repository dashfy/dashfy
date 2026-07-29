/**
 * Builds the hosted Dashfy registry from the `dashfy` metadata field published on
 * npm for each package listed in `apps/registry/extensions.json`, writing
 * per-extension item documents and an `index.json` to `apps/registry/public/r`.
 *
 * Extensions live in their own repositories, so npm — not this workspace — is the
 * source of truth for what the hosted catalog serves.
 *
 * Run with: `pnpm registry:build` (also runs automatically before `build`).
 */
import { fileURLToPath } from 'node:url'

import path from 'path'

import { buildRegistryFromNpm, readExtensionList } from '../src/commands/registry/build'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const registryDir = path.resolve(scriptDir, '../../../apps/registry')
const extensionListPath = path.join(registryDir, 'extensions.json')
const outputDir = path.join(registryDir, 'public/r')

readExtensionList(extensionListPath)
  .then((packages) => buildRegistryFromNpm({ packages, outputDir }))
  .then(({ count }) => {
    console.log(`Wrote ${count} extension(s) to ${path.relative(process.cwd(), outputDir)}`)
  })
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
