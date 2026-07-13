import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    port: 3000,
    proxy: {
      '/config': 'http://localhost:5001',
    },
  },
  plugins: [reactRouter()],
})
