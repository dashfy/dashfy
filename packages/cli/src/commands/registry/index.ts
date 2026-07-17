import { Command } from 'commander'

import { registryAdd } from '@/commands/registry/add'
import { registryBuild } from '@/commands/registry/build'
import { registryRemove } from '@/commands/registry/remove'
import { registryValidate } from '@/commands/registry/validate'

export const registry = new Command()
  .name('registry')
  .description('build and manage Dashfy extension registries')

registry.addCommand(registryBuild)
registry.addCommand(registryAdd)
registry.addCommand(registryRemove)
registry.addCommand(registryValidate)
