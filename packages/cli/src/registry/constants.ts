import type { RegistryConfig } from '@/schema'

/** Hosted registry origin (no trailing slash). */
export const REGISTRY_HOST = 'https://registry.dashfy.dev'

/**
 * Base URL (or local directory) the CLI resolves extensions from.
 *
 * Override with `DASHFY_REGISTRY_URL` to point at a local build directory for
 * offline/dev work (the registry analog of `DASHFY_TEMPLATE_DIR`).
 */
export const REGISTRY_URL = process.env.DASHFY_REGISTRY_URL ?? `${REGISTRY_HOST}/r`

/** Default discovery index URL when `DASHFY_REGISTRIES_URL` is unset. */
export const REGISTRIES_INDEX_URL = `${REGISTRY_HOST}/registries.json`

/** Catalog name written to hosted `index.json`. */
export const REGISTRY_CATALOG_NAME = 'dashfy'

/** Built-in registry namespace for official Dashfy extensions. */
export const BUILTIN_REGISTRY_NAMESPACE = '@dashfy'

/** Filename/package prefix marking a Dashfy extension package (e.g. `ext-github`). */
export const EXTENSION_PACKAGE_PREFIX = 'ext-'

/**
 * Built-in registries that are always available. The `@dashfy` namespace maps
 * to one JSON file per extension under the registry base.
 */
export const BUILTIN_REGISTRIES: RegistryConfig = {
  [BUILTIN_REGISTRY_NAMESPACE]: `${REGISTRY_URL}/{name}.json`,
}

/** Name of the registry index document served alongside the item files. */
export const REGISTRY_INDEX_FILE = 'index.json'
