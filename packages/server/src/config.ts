import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'

import type { DashfyConfig } from '@dashfy/types'
import { getErrorMessage } from '@dashfy/utils'
import { parse as parseYaml } from 'yaml'
import { z } from 'zod'

import { DEFAULT_PORT } from './constants'

const WidgetConfigSchema = z
  .object({
    extension: z.string(),
    widget: z.string(),
    title: z.string().optional(),
    columns: z.number().positive(),
    rows: z.number().positive(),
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
  })
  .passthrough() // Allow additional widget-specific properties

const DashboardConfigSchema = z.object({
  title: z.string().optional(),
  columns: z.number().positive(),
  rows: z.number().positive(),
  widgets: z.array(WidgetConfigSchema),
})

const DashfyConfigSchema = z.object({
  port: z.number().positive().default(DEFAULT_PORT),
  host: z.string().default('0.0.0.0'),
  baseDir: z.string().optional(),
  rotationDuration: z.number().positive().optional(),
  dashboards: z.array(DashboardConfigSchema).min(1),
  apis: z
    .object({
      pollInterval: z.number().positive().optional(),
    })
    .passthrough()
    .optional(),
})

/**
 * Supported configuration file formats.
 */
enum ConfigFormat {
  JSON = 'json',
  YAML = 'yaml',
}

/**
 * Determines the configuration file format based on file extension.
 *
 * @param filePath - Path to the configuration file
 * @returns The detected format (JSON or YAML)
 * @throws {Error} If the file extension is not supported
 */
function detectConfigFormat(filePath: string): ConfigFormat {
  const extension = extname(filePath).toLowerCase()

  switch (extension) {
    case '.json':
      return ConfigFormat.JSON
    case '.yml':
    case '.yaml':
      return ConfigFormat.YAML
    default:
      throw new Error(
        `Unsupported configuration file format: ${extension}. Supported formats: .json, .yml, .yaml`,
      )
  }
}

/**
 * Parses the configuration content based on the specified format.
 *
 * @param content - Raw file content as string
 * @param format - The format to parse (JSON or YAML)
 * @returns Parsed configuration object
 * @throws {Error} If parsing fails
 */
function parseConfigContent(content: string, format: ConfigFormat): unknown {
  try {
    switch (format) {
      case ConfigFormat.JSON:
        return JSON.parse(content)
      case ConfigFormat.YAML:
        return parseYaml(content)
      /* v8 ignore next 3 */
      default:
        // This should never happen due to exhaustive enum check
        throw new Error(`Unsupported format: ${format as string}`)
    }
  } catch (error) {
    throw new Error(`Failed to parse ${format.toUpperCase()} content: ${getErrorMessage(error)}`)
  }
}

/**
 * Loads and validates a Dashfy configuration file (JSON or YAML).
 *
 * Automatically detects the file format based on the extension (.json, .yml, .yaml),
 * parses the content, and validates the structure against the Zod schema.
 * Throws descriptive errors if the file cannot be read, parsed, or validation fails.
 *
 * @param path - Path to the configuration file (supports .json, .yml, .yaml)
 * @returns Validated and type-safe Dashfy configuration
 * @throws {Error} If file cannot be read, format is unsupported, or validation fails
 *
 * @example
 * ```ts
 * * // Load JSON config
 * const config = await loadConfig('./config.json')
 *
 * // Load YAML config
 * const config = await loadConfig('./config.yml')
 *
 * console.log(`Server will run on ${config.host}:${config.port}`)
 * ```
 */
export async function loadConfig(path: string): Promise<DashfyConfig> {
  try {
    // Detect format from file extension
    const format = detectConfigFormat(path)

    // Read file content
    const content = await readFile(path, 'utf-8')

    // Parse content based on format
    const rawConfig = parseConfigContent(content, format)

    // Validate and transform with Zod schema
    const config = DashfyConfigSchema.parse(rawConfig)

    return config as DashfyConfig
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')
      throw new Error(`Configuration validation failed:\n${issues}`)
    }

    // Re-throw if already formatted error
    if (error instanceof Error && error.message.includes('configuration')) {
      throw error
    }

    throw new Error(`Failed to load configuration from "${path}": ${getErrorMessage(error)}`)
  }
}
