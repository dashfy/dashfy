import { Command } from 'commander'
import path from 'path'

import { buildExtensionDocs, formatExtensionDocs } from '@/mcp/format'
import { getRegistryItems } from '@/registry/api'
import { clearRegistryContext } from '@/registry/context'
import { loadEnvFiles } from '@/utils/env-loader'
import { resolveConfig } from '@/utils/get-config'
import { getDashfyCliCommand } from '@/utils/get-package-manager'
import { handleError } from '@/utils/handle-error'
import { logger } from '@/utils/logger'
import { isJson } from '@/utils/output'
import { ensureRegistries } from '@/utils/registries'

interface DocsOptions {
  cwd: string
  json?: boolean
}

export const docs = new Command()
  .name('docs')
  .description('show setup, env, and integration docs for one or more extensions')
  .argument(
    '<extensions...>',
    'extension address(es): name, @namespace/name, url, or owner/repo/name',
  )
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .option('--json', 'output as JSON', false)
  .action(async (extensions: string[], options: DocsOptions) => {
    try {
      const cwd = path.resolve(options.cwd)
      await loadEnvFiles(cwd)
      const config = await resolveConfig(cwd)

      const { registries } = await ensureRegistries(extensions, config, { cwd, persist: false })
      const resolved = await getRegistryItems(extensions, { registries })
      const command = await getDashfyCliCommand(cwd)

      if (isJson() || options.json) {
        logger.data(
          JSON.stringify(
            { items: resolved.map((item) => buildExtensionDocs(item, { command })) },
            null,
            2,
          ),
        )
      } else {
        logger.log(formatExtensionDocs(resolved, { command }))
      }
    } catch (error) {
      handleError(error)
    } finally {
      clearRegistryContext()
    }
  })
