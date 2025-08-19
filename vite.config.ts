import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/myTei/',   // 👈 this makes it work on GitHub Pages
  plugins: [react()],
})
