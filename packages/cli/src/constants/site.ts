/** Public site origin for Dashfy documentation and JSON schemas. */
export const DASHFY_SITE = 'https://dashfy.dev'

/** The CLI binary name. */
export const CLI_NAME = 'dashfy'

/**
 * Git repository used to fetch templates when `DASHFY_GITHUB_URL` is unset.
 * Override with `DASHFY_GITHUB_URL` for forks or offline/dev work.
 */
export const GITHUB_REPO_URL =
  process.env.DASHFY_GITHUB_URL ?? 'https://github.com/dashfy/dashfy.git'

/** `$schema` URL written to project `dashfy.json` files. */
export const CONFIG_SCHEMA_URL = `${DASHFY_SITE}/schema.json`

/** Documentation homepage linked from `dashfy info`. */
export const DOCS_URL = `${DASHFY_SITE}/docs`

/** `$schema` URL stamped on each built registry item document. */
export const REGISTRY_ITEM_SCHEMA_URL = `${DASHFY_SITE}/schema/registry-item.json`
