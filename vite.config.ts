import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three/')) return 'three-vendor'
          if (
            id.includes('node_modules/@react-three/fiber/') ||
            id.includes('node_modules/@react-three/drei/')
          ) return 'r3f-vendor'
          if (id.includes('node_modules/react-dom/') || id.includes('node_modules/react/')) return 'react-vendor'
          if (id.includes('node_modules/react-router') || id.includes('node_modules/framer-motion/')) return 'ui-vendor'
        },
      },
    },
    // R3F + Drei is intentionally large (lazy-loaded 3D only when needed)
    chunkSizeWarningLimit: 1000,
  },
})
