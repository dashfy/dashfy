#!/usr/bin/env node

/**
 * Outputs environment info for bug reports.
 * Matches the format expected in .github/ISSUE_TEMPLATE/bug-report.yml
 *
 * Usage: pnpm env:info
 */

import envinfo from 'envinfo'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function getDashfyVersion() {
  try {
    const serverPkg = JSON.parse(readFileSync(join(root, 'packages/server/package.json'), 'utf8'))
    return `@getdashfy/server@${serverPkg.version}`
  } catch {
    return 'unknown'
  }
}

function getGitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

const dashfyVersion = getDashfyVersion()
const gitSha = getGitSha()

const info = await envinfo.run(
  {
    System: ['OS'],
    Binaries: ['Node', 'pnpm'],
    Browsers: ['Chrome', 'Firefox', 'Safari'],
  },
  { markdown: true, showNotFound: false },
)

const dashfyLine = gitSha
  ? ` - Dashfy: ${dashfyVersion} (${gitSha})`
  : ` - Dashfy: ${dashfyVersion}`

// Insert Dashfy line after pnpm in the output
const lines = info.split('\n')
const insertIndex = lines.findIndex((l) => l.includes('pnpm'))
if (insertIndex !== -1) {
  lines.splice(insertIndex + 1, 0, dashfyLine)
}

console.log(lines.join('\n'))
