import { defineConfig } from 'tsup'

import pkg from './package.json'

type DependencyMap = Record<string, string>

const pkgDeps = pkg as unknown as {
  dependencies?: DependencyMap
  peerDependencies?: DependencyMap
}

const external = Object.keys({
  ...(pkgDeps.dependencies ?? {}),
  ...(pkgDeps.peerDependencies ?? {}),
}).sort()

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'node',
  target: 'node20',
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  treeshake: true,
  external,
})
