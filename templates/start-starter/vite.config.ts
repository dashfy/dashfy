import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: { port: 3000 },
  // SPA mode: the Dashfy UI is client-only and talks to a separate Node server.
  plugins: [tanstackStart({ spa: { enabled: true } }), viteReact()],
})
