import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [react()],
    // Production build optimizations
    build: {
      outDir: 'dist',
      sourcemap: !isProduction, // Only sourcemaps in dev
      minify: isProduction ? 'esbuild' : false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
            lexical: ['lexical', '@lexical/react'],
          },
        },
      },
    },
    // Development server config (only used in dev mode)
    server: isProduction ? undefined : {
      host: '0.0.0.0', // Required for Docker
      port: 5173,
      strictPort: true,
      disableHostCheck: true, // Alternative to allowedHosts
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
      allowedHosts: 'all', // Allow all hosts including ngrok (safe for development)
    },
  }
})
