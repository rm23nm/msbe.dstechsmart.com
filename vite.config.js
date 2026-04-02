
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
import path from "path"

export default defineConfig({
  logLevel: 'info',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',     // Bind ke semua interface (IPv4 + IPv6)
    port: 5173,
    strictPort: false,   // Coba port lain jika 5173 sudah terpakai
    open: true,          // Otomatis buka browser
  },
});