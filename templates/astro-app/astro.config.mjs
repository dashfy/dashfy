// @ts-check
import react from '@astrojs/react'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  server: { port: 3000 },
  integrations: [react()],
  vite: {
    server: {
      proxy: {
        '/config': 'http://localhost:5001',
      },
    },
  },
})
