import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/intake/',
  server: {
    host: true,
    port: 5175,
    allowedHosts: true,
    proxy: {
      '/intake/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/intake\/api/, '/api')
      },
      '/intake/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/intake\/uploads/, '/uploads')
      }
    }
  }
})
