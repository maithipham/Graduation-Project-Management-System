import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const analyzeBundle = mode === 'analyze'

  return {
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      clearMocks: true,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [
      tailwindcss(),
      react(),
      ...(analyzeBundle
        ? [
            visualizer({
              filename: 'dist/bundle-analysis.html',
              gzipSize: true,
              brotliSize: true,
              open: false,
            }),
          ]
        : []),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor'
            if (/node_modules\/(@tanstack|zustand)\//.test(id)) return 'data-vendor'
            return 'vendor'
          },
        },
      },
    },
  }
})
