import { defineConfig } from 'tsup'

import pkg from './package.json'

type DependencyMap = Record<string, string>

const pkgDeps = pkg as unknown as {
  dependencies?: DependencyMap
}

const external = Object.keys(pkgDeps.dependencies ?? {}).sort()

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'node',
  target: 'node20',
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  treeshake: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external,
})
