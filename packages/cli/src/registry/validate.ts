import fs from 'fs-extra'
import path from 'path'
import type { z } from 'zod'

import { resolveItemAddress } from '@/registry/address'
import { BUILTIN_REGISTRY_NAMESPACE, REGISTRY_INDEX_FILE } from '@/registry/constants'
import type { RegistryIndex, RegistryItem } from '@/schema'
import {
  registriesIndexSchema,
  registryIndexItemSchema,
  registryIndexSchema,
  registryItemSchema,
} from '@/schema'

export interface RegistryValidationDiagnostic {
  /** Registry file the diagnostic refers to, relative to the validated dir. */
  file: string
  message: string
  suggestion?: string
  itemName?: string
  field?: string
}

export interface RegistryValidationReport {
  valid: boolean
  /** The validated directory. */
  dir: string
  /** Number of registry item files checked (excludes index.json). */
  registryFiles: number
  /** Number of items found in index.json. */
  items: number
  diagnostics: RegistryValidationDiagnostic[]
}

export interface ValidateRegistryOptions {
  /** Directory containing the built registry (index.json + {name}.json files). */
  dir: string
  /** Optional path to a registries.json discovery file to validate too. */
  registriesFile?: string
}

interface RegistryValidationContext {
  dir: string
  diagnostics: RegistryValidationDiagnostic[]
}

/**
 * Validates a built Dashfy registry directory: the `index.json` catalog plus one
 * `{name}.json` document per extension. Mirrors shadcn's report-based validator,
 * adapted to Dashfy's hosted-artifact model (no include trees or file lists).
 *
 * Never throws for validation problems; everything is reported as a diagnostic.
 */
export async function validateRegistry(
  options: ValidateRegistryOptions,
): Promise<RegistryValidationReport> {
  const context: RegistryValidationContext = { dir: options.dir, diagnostics: [] }

  if (!(await isDirectory(options.dir))) {
    addDiagnostic(context, {
      file: '.',
      message: `Registry directory was not found or is not a directory: ${options.dir}.`,
      suggestion: 'Build the registry first (dashfy registry build) or pass the correct directory.',
    })
    return createReport(context, 0, 0)
  }

  const index = await readIndex(context)
  const itemFiles = await readItemFiles(context)

  validateFilenames(context, itemFiles)
  validateDuplicates(context, itemFiles)
  if (index) {
    validateIndexConsistency(context, index, itemFiles)
  }
  validateRegistryDependencies(context, itemFiles)

  if (options.registriesFile) {
    await validateDiscoveryFile(context, options.registriesFile)
  }

  return createReport(context, itemFiles.length, index?.items.length ?? 0)
}

interface ItemFile {
  /** Basename, e.g. `github.json`. */
  file: string
  /** Basename without extension, e.g. `github`. */
  base: string
  item: RegistryItem
}

async function readIndex(context: RegistryValidationContext): Promise<RegistryIndex | null> {
  const indexPath = path.join(context.dir, REGISTRY_INDEX_FILE)
  if (!(await fs.pathExists(indexPath))) {
    addDiagnostic(context, {
      file: REGISTRY_INDEX_FILE,
      message: 'Missing index.json catalog.',
      suggestion: 'Generate it with dashfy registry build.',
    })
    return null
  }

  const json = await readJson(context, REGISTRY_INDEX_FILE)
  if (json === undefined) {
    return null
  }

  const parsed = registryIndexSchema.safeParse(json)
  if (!parsed.success) {
    addZodDiagnostics(context, REGISTRY_INDEX_FILE, parsed.error, {
      suggestion: 'Update index.json to match the registry index schema.',
    })
    return null
  }
  return parsed.data
}

async function readItemFiles(context: RegistryValidationContext): Promise<ItemFile[]> {
  const entries = await fs.readdir(context.dir, { withFileTypes: true })
  const jsonFiles = entries
    .filter(
      (entry) =>
        entry.isFile() && entry.name.endsWith('.json') && entry.name !== REGISTRY_INDEX_FILE,
    )
    .map((entry) => entry.name)
    .sort()

  const items: ItemFile[] = []
  for (const file of jsonFiles) {
    const json = await readJson(context, file)
    if (json === undefined) {
      continue
    }

    const parsed = registryItemSchema.safeParse(json)
    if (!parsed.success) {
      addZodDiagnostics(context, file, parsed.error, {
        suggestion: 'Update the item so it matches the registry item schema.',
      })
      continue
    }

    items.push({ file, base: file.slice(0, -'.json'.length), item: parsed.data })
  }
  return items
}

function validateFilenames(context: RegistryValidationContext, itemFiles: ItemFile[]): void {
  for (const { file, base, item } of itemFiles) {
    if (item.name !== base) {
      addDiagnostic(context, {
        file,
        itemName: item.name,
        message: `Filename "${file}" does not match item name "${item.name}".`,
        suggestion: `Rename the file to "${item.name}.json" or change the item name to "${base}".`,
      })
    }
  }
}

function validateDuplicates(context: RegistryValidationContext, itemFiles: ItemFile[]): void {
  const seen = new Map<string, string>()
  for (const { file, item } of itemFiles) {
    const existing = seen.get(item.name)
    if (existing) {
      addDiagnostic(context, {
        file,
        itemName: item.name,
        message: `Duplicate registry item name "${item.name}". First defined in ${existing}.`,
        suggestion: 'Rename one of these items so each name is unique across the registry.',
      })
      continue
    }
    seen.set(item.name, file)
  }
}

function validateIndexConsistency(
  context: RegistryValidationContext,
  index: RegistryIndex,
  itemFiles: ItemFile[],
): void {
  const itemsByName = new Map(itemFiles.map((entry) => [entry.item.name, entry]))
  const indexNames = new Set<string>()

  for (const indexItem of index.items) {
    indexNames.add(indexItem.name)
    const entry = itemsByName.get(indexItem.name)
    if (!entry) {
      addDiagnostic(context, {
        file: REGISTRY_INDEX_FILE,
        itemName: indexItem.name,
        message: `index.json lists "${indexItem.name}" but ${indexItem.name}.json is missing.`,
        suggestion: 'Add the missing item file or remove it from index.json.',
      })
      continue
    }

    const expected = registryIndexItemSchema.parse(entry.item)
    const mismatched = (['type', 'title', 'description', 'categories'] as const).filter(
      (field) => !deepEqual(indexItem[field], expected[field]),
    )
    if (mismatched.length > 0) {
      addDiagnostic(context, {
        file: REGISTRY_INDEX_FILE,
        itemName: indexItem.name,
        field: mismatched.join(', '),
        message: `index.json entry for "${indexItem.name}" is out of sync with ${entry.file} (${mismatched.join(', ')}).`,
        suggestion: 'Rebuild the registry (dashfy registry build) so index.json matches the items.',
      })
    }
  }

  for (const { file, item } of itemFiles) {
    if (!indexNames.has(item.name)) {
      addDiagnostic(context, {
        file,
        itemName: item.name,
        message: `${file} is not listed in index.json.`,
        suggestion: 'Add the item to index.json or rebuild the registry.',
      })
    }
  }
}

function validateRegistryDependencies(
  context: RegistryValidationContext,
  itemFiles: ItemFile[],
): void {
  const names = new Set(itemFiles.map((entry) => entry.item.name))

  for (const { file, item } of itemFiles) {
    for (const dependency of item.registryDependencies ?? []) {
      const resolved = resolveItemAddress(dependency)
      // Only local same-registry references can be checked offline; remote
      // (url/github) and file addresses are intentionally skipped.
      if (resolved.scheme !== 'namespace' || resolved.namespace !== BUILTIN_REGISTRY_NAMESPACE) {
        continue
      }
      if (!names.has(resolved.item)) {
        addDiagnostic(context, {
          file,
          itemName: item.name,
          field: 'registryDependencies',
          message: `Unresolved registry dependency "${dependency}" in "${item.name}".`,
          suggestion: `Add ${resolved.item}.json to this registry or fix the dependency address.`,
        })
      }
    }
  }
}

async function validateDiscoveryFile(
  context: RegistryValidationContext,
  registriesFile: string,
): Promise<void> {
  const relative = path.relative(context.dir, registriesFile) || path.basename(registriesFile)
  if (!(await fs.pathExists(registriesFile))) {
    addDiagnostic(context, {
      file: relative,
      message: `Discovery file was not found: ${registriesFile}.`,
      suggestion: 'Pass the correct path to your registries.json file.',
    })
    return
  }

  let json: unknown
  try {
    json = await fs.readJson(registriesFile)
  } catch {
    addDiagnostic(context, {
      file: relative,
      message: 'Discovery file contains invalid JSON.',
      suggestion: 'Fix the JSON syntax in your registries.json file.',
    })
    return
  }

  const parsed = registriesIndexSchema.safeParse(json)
  if (!parsed.success) {
    addZodDiagnostics(context, relative, parsed.error, {
      suggestion: 'Update registries.json to match the discovery index schema.',
    })
  }
}

async function readJson(context: RegistryValidationContext, file: string): Promise<unknown> {
  try {
    return await fs.readJson(path.join(context.dir, file))
  } catch {
    addDiagnostic(context, {
      file,
      message: `${file} contains invalid JSON or could not be read.`,
      suggestion: 'Fix the JSON syntax in this file.',
    })
    return undefined
  }
}

function addDiagnostic(
  context: RegistryValidationContext,
  diagnostic: RegistryValidationDiagnostic,
): void {
  context.diagnostics.push(diagnostic)
}

function addZodDiagnostics(
  context: RegistryValidationContext,
  file: string,
  error: z.ZodError,
  options: { itemName?: string; suggestion?: string } = {},
): void {
  for (const issue of error.errors) {
    addDiagnostic(context, {
      file,
      itemName: options.itemName,
      field: issue.path.join('.') || undefined,
      message: issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
      suggestion: options.suggestion,
    })
  }
}

function createReport(
  context: RegistryValidationContext,
  registryFiles: number,
  items: number,
): RegistryValidationReport {
  return {
    valid: context.diagnostics.length === 0,
    dir: context.dir,
    registryFiles,
    items,
    diagnostics: context.diagnostics,
  }
}

async function isDirectory(target: string): Promise<boolean> {
  try {
    return (await fs.stat(target)).isDirectory()
  } catch {
    return false
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
