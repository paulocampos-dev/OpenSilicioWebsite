import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [react()],
    // Resolve configuration for better compatibility with Lexical packages
    resolve: {
      dedupe: ['react', 'react-dom'],
      // Fix for Lexical packages that don't have proper "exports" field
      conditions: ['import', 'module', 'browser', 'default'],
      // Force Vite to use main/module fields for packages without proper exports
      mainFields: ['module', 'browser', 'main'],
      // Preserve symlinks to help with module resolution
      preserveSymlinks: false,
    },
    // Experimental: Force external resolution strategy
    ssr: {
      noExternal: [/@lexical\/.*/],
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        '@lexical/react',
        '@lexical/code',
        '@lexical/file',
        '@lexical/history',
        '@lexical/link',
        '@lexical/list',
        '@lexical/markdown',
        '@lexical/rich-text',
        '@lexical/utils',
        'lexical',
      ],
    },
    // Production build optimizations
    build: {
      outDir: 'dist',
      sourcemap: !isProduction, // Only sourcemaps in dev
      minify: isProduction ? 'esbuild' : false,
      chunkSizeWarningLimit: 1000,
      // Force Vite to process Lexical packages during build
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
        requireReturnsDefault: 'auto',
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
            lexical: ['lexical'],
          },
        },
        // Override package resolution for Lexical packages
        onwarn(warning, warn) {
          // Suppress warnings for Lexical packages
          if (warning.code === 'UNRESOLVED_IMPORT' && warning.source && warning.source.startsWith('@lexical/')) {
            return
          }
          warn(warning)
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
