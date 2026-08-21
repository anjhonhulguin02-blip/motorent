import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Vite defaults to 5173 and ignores PORT on its own. Honouring it here lets
    // the dev server take an assigned port when 5173 is already taken, instead
    // of failing to start. Nothing here depends on a fixed port — Supabase auth
    // redirects are built from window.location.origin at runtime.
    port: process.env.PORT ? Number(process.env.PORT) : undefined
  }
})