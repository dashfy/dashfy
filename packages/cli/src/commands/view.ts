import { Command } from 'commander'
import path from 'path'

import { getRegistryItems } from '@/registry/api'
import { clearRegistryContext } from '@/registry/context'
import { loadEnvFiles } from '@/utils/env-loader'
import { resolveConfig } from '@/utils/get-config'
import { handleError } from '@/utils/handle-error'
import { logger } from '@/utils/logger'
import { ensureRegistries } from '@/utils/registries'

interface ViewOptions {
  cwd: string
}

export const view = new Command()
  .name('view')
  .description('view the full registry item JSON for one or more extensions')
  .argument('<items...>', 'item address(es): name, @namespace/name, url, or owner/repo/name')
  .option('-c, --cwd <cwd>', 'the working directory', process.cwd())
  .action(async (items: string[], options: ViewOptions) => {
    try {
      const cwd = path.resolve(options.cwd)
      await loadEnvFiles(cwd)
      const config = await resolveConfig(cwd)

      const { registries } = await ensureRegistries(items, config, { cwd, persist: false })
      const resolved = await getRegistryItems(items, { registries })

      logger.data(JSON.stringify(resolved, null, 2))
    } catch (error) {
      handleError(error)
    } finally {
      clearRegistryContext()
    }
  })
