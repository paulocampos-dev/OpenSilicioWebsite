import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Required for Docker
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: false, // Use native file watching (faster)
      interval: 1000,
    },
    hmr: {
      host: 'localhost', // HMR host (use 'localhost' when accessing from host machine)
      port: 5173,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
