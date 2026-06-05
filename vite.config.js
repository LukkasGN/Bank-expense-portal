import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Existing — Camunda Engine REST (unchanged)
      '/engine-rest': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // New — Document metadata API (server.js on port 4000)
      '/docs-api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/docs-api/, ''),
      },
    },
  },
})
