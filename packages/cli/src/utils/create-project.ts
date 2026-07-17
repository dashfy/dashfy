import os from 'node:os'

import { execa } from 'execa'
import fs from 'fs-extra'
import path from 'path'

import { GITHUB_REPO_URL } from '@/constants/site'

export interface ScaffoldOptions {
  /** Directory name under `templates/` (e.g. "vite-app"). */
  templateDir: string
  /** Absolute path of the project to create. */
  projectPath: string
}

const copyFilter = (src: string): boolean => !src.includes('node_modules')

/**
 * Materializes a template into `projectPath`.
 *
 * - If `DASHFY_TEMPLATE_DIR` is set, copies from that local directory (used for
 *   local/offline development).
 * - Otherwise performs a sparse `git clone` of `templates/<templateDir>` from
 *   the Dashfy repo (overridable via `DASHFY_GITHUB_URL`).
 */
export async function scaffoldTemplate({
  templateDir,
  projectPath,
}: ScaffoldOptions): Promise<void> {
  const localDir = process.env.DASHFY_TEMPLATE_DIR
  if (localDir) {
    const source = path.resolve(localDir, templateDir)
    if (!(await fs.pathExists(source))) {
      throw new Error(`Template "${templateDir}" not found in DASHFY_TEMPLATE_DIR (${source}).`)
    }
    await fs.copy(source, projectPath, { filter: copyFilter })
    return
  }

  const tmpDir = path.join(os.tmpdir(), `dashfy-template-${Date.now()}`)
  try {
    await execa('git', [
      'clone',
      '--depth',
      '1',
      '--filter=blob:none',
      '--sparse',
      GITHUB_REPO_URL,
      tmpDir,
    ])
    await execa('git', ['-C', tmpDir, 'sparse-checkout', 'set', `templates/${templateDir}`])

    const extracted = path.resolve(tmpDir, 'templates', templateDir)
    if (!(await fs.pathExists(extracted))) {
      throw new Error(`Template "${templateDir}" not found in ${GITHUB_REPO_URL}.`)
    }
    await fs.copy(extracted, projectPath, { filter: copyFilter })
  } finally {
    await fs.remove(tmpDir)
  }
}
