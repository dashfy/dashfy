import type { DashfyPaths } from '@/schema'

export const DEFAULT_APP_PATH = 'src/App.tsx'
export const DEFAULT_SERVER_PATH = 'dashfy.server.ts'
export const DEFAULT_CONFIG_PATH = 'dashfy.config.yml'
export const DEFAULT_ENV_PATH = '.env'

/** Default `paths` object written to `dashfy.json` during `dashfy init`. */
export const DEFAULT_PATHS = {
  app: DEFAULT_APP_PATH,
  server: DEFAULT_SERVER_PATH,
  config: DEFAULT_CONFIG_PATH,
  env: DEFAULT_ENV_PATH,
} satisfies DashfyPaths

/** Discovery order for preflight when `dashfy.json` paths are unset. */
export const APP_CANDIDATES = [DEFAULT_APP_PATH, 'src/app.tsx', 'App.tsx', 'app.tsx']
export const SERVER_CANDIDATES = [
  DEFAULT_SERVER_PATH,
  'server.ts',
  'src/server.ts',
  'src/dashfy.server.ts',
]
export const CONFIG_CANDIDATES = [DEFAULT_CONFIG_PATH, 'dashfy.config.yaml', 'dashfy.config.json']
