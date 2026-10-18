import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Aspire injects the API's URL as API_HTTPS / API_HTTP (from WithReference(api) in the AppHost).
const apiTarget = process.env.API_HTTPS ?? process.env.API_HTTP

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
