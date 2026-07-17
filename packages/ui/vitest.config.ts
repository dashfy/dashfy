import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // TODO: Remove this eslint-disable once we have a better solution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react()] as any,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
