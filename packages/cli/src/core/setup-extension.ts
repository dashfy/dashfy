import type { RegistryItem } from '@/schema'
import type { DashfyProject } from '@/utils/preflight'
import type { RemoveResult, UpdateResult } from '@/utils/updaters/update-app'
import { removeFromApp, updateApp } from '@/utils/updaters/update-app'
import { removeFromConfig, updateConfig } from '@/utils/updaters/update-config'
import { removeFromEnv, updateEnv } from '@/utils/updaters/update-env'
import { removeFromServer, updateServer } from '@/utils/updaters/update-server'

type StepResult = UpdateResult | 'n/a'
type RemoveStepResult = RemoveResult | 'n/a'

export interface SetupResult {
  app: StepResult
  server: StepResult
  config: StepResult
  env: StepResult
}

export interface TeardownResult {
  app: RemoveStepResult
  server: RemoveStepResult
  config: RemoveStepResult
  env: RemoveStepResult
  /** Env vars left in place because they still hold a value. */
  keptEnvVars: string[]
}

/**
 * Strips the version suffix from a dependency spec.
 * `@dashfy/ext-github@^0.1.0` -> `@dashfy/ext-github`
 */
export function stripVersion(dependency: string): string {
  return dependency.replace(/@[^@/]+$/, '')
}

/**
 * Applies all file edits required to set up an extension in a project. Does NOT
 * install dependencies (the caller handles installation). Every step is
 * idempotent.
 */
export async function setupExtension(
  project: DashfyProject,
  item: RegistryItem,
): Promise<SetupResult> {
  const { extensionKey, widgets, client, starter } = item.meta
  const { envVars } = item
  const widgetPackage = stripVersion(item.dependencies[0] ?? '')

  const app = await updateApp({
    appFile: project.appFile,
    extensionKey,
    widgetPackage,
    widgets,
  })

  let server: StepResult = 'n/a'
  if (client) {
    if (project.serverFile) {
      server = await updateServer({
        serverFile: project.serverFile,
        extensionKey,
        client,
      })
    }
  }

  let config: StepResult = 'n/a'
  if (project.configFile && starter && starter.length > 0) {
    config = await updateConfig({
      configFile: project.configFile,
      title: item.title,
      extensionKey,
      starter,
    })
  }

  let env: StepResult = 'n/a'
  if (envVars && envVars.length > 0) {
    env = await updateEnv({ envFile: project.envFile, envVars })
  }

  return { app, server, config, env }
}

/**
 * Reverses {@link setupExtension}: removes all file edits an extension added.
 * Does NOT uninstall dependencies (the caller handles that). Every step is
 * idempotent, so removing an absent extension is safe.
 */
export async function teardownExtension(
  project: DashfyProject,
  item: RegistryItem,
): Promise<TeardownResult> {
  const { extensionKey, widgets, client, starter } = item.meta
  const { envVars } = item
  const widgetPackage = stripVersion(item.dependencies[0] ?? '')

  const app = await removeFromApp({
    appFile: project.appFile,
    extensionKey,
    widgetPackage,
    widgets,
  })

  let server: RemoveStepResult = 'n/a'
  if (client && project.serverFile) {
    server = await removeFromServer({
      serverFile: project.serverFile,
      extensionKey,
      client,
    })
  }

  let config: RemoveStepResult = 'n/a'
  if (project.configFile && starter && starter.length > 0) {
    config = await removeFromConfig({
      configFile: project.configFile,
      extensionKey,
    })
  }

  let env: RemoveStepResult = 'n/a'
  let keptEnvVars: string[] = []
  if (envVars && envVars.length > 0) {
    const envResult = await removeFromEnv({ envFile: project.envFile, envVars })
    env = envResult.result
    keptEnvVars = envResult.kept
  }

  return { app, server, config, env, keptEnvVars }
}
