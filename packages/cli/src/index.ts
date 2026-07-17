import { Command } from 'commander'

import { add } from '@/commands/add'
import { docs } from '@/commands/docs'
import { doctor } from '@/commands/doctor'
import { info } from '@/commands/info'
import { init } from '@/commands/init'
import { mcp } from '@/commands/mcp'
import { registry } from '@/commands/registry'
import { remove } from '@/commands/remove'
import { search } from '@/commands/search'
import { view } from '@/commands/view'
import { CLI_NAME } from '@/constants/site'
import { setOutputMode } from '@/utils/output'

import packageJson from '../package.json'

const program = new Command()

program
  .name(CLI_NAME)
  .description('Dashfy CLI - scaffold dashboards and add extensions')
  .version(packageJson.version, '-v, --version', 'display the version number')
  .option('--json', 'output machine-readable JSON (suppresses other output)', false)
  .option('--silent', 'mute non-error output', false)
  .hook('preAction', (_thisCommand, actionCommand) => {
    const root = program.opts<{ json?: boolean; silent?: boolean }>()
    const local = actionCommand.opts<{ json?: boolean; silent?: boolean }>()
    setOutputMode({
      json: Boolean(root.json) || Boolean(local.json),
      silent: Boolean(root.silent) || Boolean(local.silent),
    })
  })

program.addCommand(init)
program.addCommand(add)
program.addCommand(remove)
program.addCommand(registry)
program.addCommand(info)
program.addCommand(doctor)
program.addCommand(search)
program.addCommand(view)
program.addCommand(docs)
program.addCommand(mcp)

program.parse()
