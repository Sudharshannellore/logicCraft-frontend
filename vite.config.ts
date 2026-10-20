import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  optimizeDeps: {
    // Crawl every page up front (they're lazy-loaded), so dependencies are pre-bundled at startup
    // instead of mid-session — a late re-bundle invalidates loaded chunks and breaks navigation.
    entries: ['index.html', 'src/**/*.{ts,tsx}'],
  },
})
