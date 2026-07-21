import { z } from 'zod'

/**
 * Server registration mode for an extension's data-source client.
 *
 * - `poll`: the server periodically calls the API methods (default).
 * - `push`: the API streams data via a callback (e.g. system metrics).
 */
export const extensionClientModeSchema = z.enum(['poll', 'push'])

/**
 * Describes how to set up an extension's server-side data-source client in the
 * Dashfy server bootstrap file.
 */
export const extensionClientSchema = z.object({
  /** Module specifier to import the factory from (e.g. `@getdashfy/ext-system/client`). */
  import: z.string(),
  /** Named factory export (e.g. `createGitHubClient`). */
  factory: z.string(),
  /** Registration mode passed to `dashfy.registerApi`. */
  mode: extensionClientModeSchema,
  /** Raw TS source for the factory options argument, e.g. `{ token: process.env.GITHUB_TOKEN! }`. */
  options: z.string().optional(),
})

/**
 * A starter widget block appended to `dashfy.config.yml` when the extension is
 * added. The `widget` key references a registered widget; any other keys are
 * widget-specific props. Grid coordinates (`x`, `y`, `columns`, `rows`) are
 * computed by the CLI.
 */
export const extensionStarterWidgetSchema = z
  .object({
    widget: z.string(),
  })
  .passthrough()

/**
 * Dashfy-specific setup metadata for an extension. This is the codemod
 * counterpart to shadcn's file list: instead of copying files, Dashfy uses it
 * to register widgets, register the server client, and seed the config.
 */
export const extensionMetaSchema = z.object({
  /** Extension id used as the `extension` field in dashboard config and registry keys. */
  extensionKey: z.string(),
  /** Widget component export names registered via `WidgetRegistry.addExtension`. */
  widgets: z.array(z.string()).min(1),
  /** Server client setup; omitted for browser-only extensions (e.g. market-live). */
  client: extensionClientSchema.optional(),
  /** Starter widgets appended to the config when the extension is added. */
  starter: z.array(extensionStarterWidgetSchema).optional(),
})

/**
 * A single registry item describing a Dashfy extension. Mirrors shadcn's
 * `registryItemSchema`, but the payload is npm + setup metadata rather than
 * file contents.
 */
export const registryItemSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  type: z.literal('registry:extension'),
  title: z.string(),
  description: z.string().optional(),
  /** npm dependencies installed when the extension is added, e.g. `@getdashfy/ext-github@^0.1.0`. */
  dependencies: z.array(z.string()).min(1),
  /** Other registry items (extensions) this one depends on, by address. */
  registryDependencies: z.array(z.string()).optional(),
  /** Environment variables the extension needs (added to `.env`). */
  envVars: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  docs: z.string().optional(),
  meta: extensionMetaSchema,
})

/** A condensed item used in the catalog index served at `/r/index.json`. */
export const registryIndexItemSchema = registryItemSchema.pick({
  name: true,
  type: true,
  title: true,
  description: true,
  categories: true,
})

/** The full source catalog (array of items) used by `loadRegistry`. */
export const registrySchema = z.array(registryItemSchema)

/** The index document served at `/r/index.json`. */
export const registryIndexSchema = z.object({
  name: z.string(),
  homepage: z.string().optional(),
  items: z.array(registryIndexItemSchema),
})

/**
 * A custom registry endpoint. Either a URL template containing `{name}` or an
 * object form with optional auth params/headers (values may use `${ENV}`).
 */
export const registryConfigItemSchema = z.union([
  z.string().refine((value) => value.includes('{name}'), {
    message: 'Registry URL must include the {name} placeholder',
  }),
  z.object({
    url: z.string().refine((value) => value.includes('{name}'), {
      message: 'Registry URL must include the {name} placeholder',
    }),
    params: z.record(z.string(), z.string()).optional(),
    headers: z.record(z.string(), z.string()).optional(),
  }),
])

/** Map of `@namespace` to its registry endpoint. */
export const registryConfigSchema = z.record(
  z.string().refine((key) => key.startsWith('@'), {
    message: 'Registry names must start with @ (e.g., @getdashfy, @acme)',
  }),
  registryConfigItemSchema,
)

/**
 * A single entry in the hosted discovery index: a public registry namespace
 * plus the URL template it resolves to and optional presentation metadata.
 */
export const registryEntrySchema = z.object({
  url: z.string().refine((value) => value.includes('{name}'), {
    message: 'Registry URL must include the {name} placeholder',
  }),
  name: z.string().optional(),
  description: z.string().optional(),
  homepage: z.string().optional(),
})

/**
 * The discovery index served at `/registries.json`. Maps known `@namespace`s to
 * their endpoints so the CLI can suggest and auto-configure third-party
 * registries without the user hand-editing `dashfy.json`.
 */
export const registriesIndexSchema = z.object({
  $schema: z.string().optional(),
  registries: z.record(
    z.string().refine((key) => key.startsWith('@'), {
      message: 'Registry names must start with @ (e.g., @getdashfy, @acme)',
    }),
    registryEntrySchema,
  ),
})

/** Project file locations the CLI applies changes to; overrides preflight heuristics. */
export const dashfyPathsSchema = z.object({
  app: z.string().optional(),
  server: z.string().optional(),
  config: z.string().optional(),
  env: z.string().optional(),
})

/** The `dashfy.json` project configuration file. */
export const dashfyConfigSchema = z.object({
  $schema: z.string().optional(),
  registries: registryConfigSchema.optional(),
  paths: dashfyPathsSchema.optional(),
})

export type ExtensionClientMode = z.infer<typeof extensionClientModeSchema>
export type ExtensionClient = z.infer<typeof extensionClientSchema>
export type ExtensionStarterWidget = z.infer<typeof extensionStarterWidgetSchema>
export type ExtensionMeta = z.infer<typeof extensionMetaSchema>
export type RegistryItem = z.infer<typeof registryItemSchema>
export type RegistryIndexItem = z.infer<typeof registryIndexItemSchema>
export type Registry = z.infer<typeof registrySchema>
export type RegistryIndex = z.infer<typeof registryIndexSchema>
export type RegistryConfigItem = z.infer<typeof registryConfigItemSchema>
export type RegistryConfig = z.infer<typeof registryConfigSchema>
export type RegistryEntry = z.infer<typeof registryEntrySchema>
export type RegistriesIndex = z.infer<typeof registriesIndexSchema>
export type DashfyConfig = z.infer<typeof dashfyConfigSchema>
export type DashfyPaths = z.infer<typeof dashfyPathsSchema>

/** @deprecated use {@link RegistryItem}. Retained during migration. */
export type RegistryExtension = RegistryItem
