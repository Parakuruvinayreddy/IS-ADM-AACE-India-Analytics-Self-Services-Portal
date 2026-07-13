import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  server: {
    host: true,
    port: 3002,
    allowedHosts: true,
    proxy: {
      '/admin/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin\/api/, '/api')
      },
      '/admin/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin\/uploads/, '/uploads')
      }
    }
  }
})
