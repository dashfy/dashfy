import path from 'node:path'

import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // TODO: Remove this eslint-disable once we have a better solution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react()] as any,
  // Mirrors the "@/*" path mapping in tsconfig.json so modules using it are testable.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
