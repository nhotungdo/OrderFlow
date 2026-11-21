import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api/orders': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/inventory': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      '/api/payments': {
        target: 'http://localhost:5004',
        changeOrigin: true,
      },
    },
  },
})
