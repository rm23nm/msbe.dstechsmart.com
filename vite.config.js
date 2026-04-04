
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"

export default defineConfig({
  logLevel: 'info',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MasjidKu Smart',
        short_name: 'MasjidKu',
        description: 'Aplikasi Manajemen Masjid Modern',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    open: true,
  },
});