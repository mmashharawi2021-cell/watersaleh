import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this repository under /watersaleh/
export default defineConfig({
  base: '/watersaleh/',
  plugins: [react()],
})
