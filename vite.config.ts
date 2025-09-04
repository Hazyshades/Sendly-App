import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные из .env файлов
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  envDir: '.',
  envPrefix: 'VITE_'
  }
}) 