import fs from 'fs-extra'
import path from 'path'

import { EXTENSION_PACKAGE_PREFIX } from '@/registry/constants'

/**
 * Returns the extension packages installed in the project, detected from
 * `package.json` dependencies whose name is or contains `ext-` (e.g.
 * `@dashfy/ext-github`, `ext-github`). Returns an empty list when there is no
 * package.json or it cannot be read.
 */
export async function getInstalledExtensions(cwd: string): Promise<string[]> {
  const pkgPath = path.join(cwd, 'package.json')
  if (!(await fs.pathExists(pkgPath))) {
    return []
  }
  try {
    const pkg = (await fs.readJson(pkgPath)) as { dependencies?: Record<string, string> }
    return Object.keys(pkg.dependencies ?? {})
      .filter(
        (name) =>
          name.startsWith(EXTENSION_PACKAGE_PREFIX) ||
          name.includes(`/${EXTENSION_PACKAGE_PREFIX}`),
      )
      .sort()
  } catch {
    return []
  }
}
