import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
// vitest/config's defineConfig accepts Vite options plus the `test` block, so app and tests share one setup.
import { defineConfig } from 'vitest/config'

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
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Theme CSS is read as text by the token tests; Vitest blanks CSS it doesn't process.
    css: { include: [/styles\/themes\/.+\.css/] },
  },
})
