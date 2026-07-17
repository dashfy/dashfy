import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    compilerOptions: {
      lib: ['ES2022', 'DOM'],
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
})
