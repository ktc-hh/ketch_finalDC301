import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
  },
})
