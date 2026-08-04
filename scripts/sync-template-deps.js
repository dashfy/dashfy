#!/usr/bin/env node

/**
 * Rewrites the `@getdashfy/*` ranges in every `templates/*` package.json to the
 * versions currently published on npm.
 *
 * Templates are standalone projects outside the pnpm workspace, so their ranges are
 * hand-maintained, and a 0.x caret is strict: `^0.2.1` excludes `0.3.0`. A freshly
 * published minor therefore never reaches new scaffolds until the templates are bumped.
 * Run this straight after `pnpm changeset:publish`, since it reads the `latest`
 * dist-tag from the registry.
 *
 * Set DASHFY_NPM_REGISTRY_URL to a mirror, or to a local directory of
 * `<package name>.json` packuments, to run against something other than npm.
 *
 * Usage: pnpm sync:templates [--dry-run]
 */

import { readdir, readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const SCOPE = '@getdashfy/'
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies']
const NPM_REGISTRY_URL = 'https://registry.npmjs.org'

/** The only range shapes we rewrite: `^1.2.3`, `~1.2.3` or a bare `1.2.3` pin. */
const SIMPLE_RANGE = /^([~^]?)(\d[^\s|]*)$/

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const templatesDir = join(root, 'templates')
const dryRun = process.argv.includes('--dry-run')

function isUrl(value) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/** Mirrors the CLI's packument resolution so both honour the same override. */
function resolvePackumentSource(packageName) {
  const base = process.env.DASHFY_NPM_REGISTRY_URL ?? NPM_REGISTRY_URL

  return isUrl(base)
    ? `${base.replace(/\/+$/, '')}/${packageName.replace('/', '%2F')}`
    : join(base, `${packageName}.json`)
}

/** Returns the packument, or null when the package is not published. */
async function readPackument(source) {
  if (!isUrl(source)) {
    try {
      return JSON.parse(await readFile(source, 'utf8'))
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null
      }
      throw error
    }
  }

  const response = await fetch(source, {
    headers: { Accept: 'application/json', 'User-Agent': 'dashfy' },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`${source} responded ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Extensions are published from their own repositories, so an unpublished one must
 * not stop the rest of the sync.
 */
async function fetchLatestVersion(packageName) {
  const packument = await readPackument(resolvePackumentSource(packageName))
  const latest = packument?.['dist-tags']?.latest

  if (!latest) {
    console.warn(`  ! ${packageName} has no published "latest" version, leaving it unchanged`)
    return null
  }

  return latest
}

async function readTemplates() {
  const entries = await readdir(templatesDir, { withFileTypes: true })
  const templates = []

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    const file = join(templatesDir, entry.name, 'package.json')

    try {
      templates.push({ name: entry.name, file, pkg: JSON.parse(await readFile(file, 'utf8')) })
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  return templates
}

function collectScopedNames(templates) {
  const names = new Set()

  for (const { pkg } of templates) {
    for (const field of DEPENDENCY_FIELDS) {
      for (const name of Object.keys(pkg[field] ?? {})) {
        if (name.startsWith(SCOPE)) {
          names.add(name)
        }
      }
    }
  }

  return [...names].sort()
}

/** Rewrites in place, keeping each entry's existing range operator. */
function applyVersions(pkg, versions) {
  const changes = []

  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, range] of Object.entries(pkg[field] ?? {})) {
      const latest = versions.get(name)

      if (!latest) {
        continue
      }

      const match = SIMPLE_RANGE.exec(range)

      if (!match) {
        console.warn(`  ! ${name} is set to "${range}", leaving it unchanged`)
        continue
      }

      const next = `${match[1]}${latest}`

      if (next !== range) {
        pkg[field][name] = next
        changes.push({ name, from: range, to: next })
      }
    }
  }

  return changes
}

async function main() {
  const templates = await readTemplates()
  const names = collectScopedNames(templates)

  if (names.length === 0) {
    console.log(`No ${SCOPE}* dependencies found in templates/.`)
    return
  }

  console.log(`Resolving ${names.length} ${SCOPE}* package(s)`)

  const versions = new Map()

  await Promise.all(
    names.map(async (name) => {
      const latest = await fetchLatestVersion(name)

      if (latest) {
        versions.set(name, latest)
        console.log(`  ${name}@${latest}`)
      }
    }),
  )

  let changed = 0

  for (const template of templates) {
    const changes = applyVersions(template.pkg, versions)

    if (changes.length === 0) {
      continue
    }

    changed += 1
    console.log(`\n${template.name}`)

    for (const change of changes) {
      console.log(`  ${change.name}: ${change.from} -> ${change.to}`)
    }

    if (!dryRun) {
      await writeFile(template.file, `${JSON.stringify(template.pkg, null, 2)}\n`)
    }
  }

  if (changed === 0) {
    console.log('\nTemplates are already up to date.')
  } else if (dryRun) {
    console.log(`\n${changed} template(s) would change. Re-run without --dry-run to write.`)
  } else {
    console.log(`\nUpdated ${changed} template(s).`)
  }
}

try {
  await main()
} catch (error) {
  console.error(`sync-template-deps failed: ${error.message}`)
  process.exitCode = 1
}
