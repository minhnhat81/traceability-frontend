import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// ✅ Cấu hình chuẩn cho Vite + React + TypeScript
export default defineConfig({
  plugins: [react()],

  // ⚙️ Cấu hình server dev
  server: {
    port: 3002,
    host: true,

    // ✅ Thêm proxy sang backend FastAPI
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // 🧩 Địa chỉ backend FastAPI
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'), // giữ nguyên tiền tố /api
      },
    },
  },

  // ✅ Alias giúp tránh lỗi "Failed to resolve import"
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
})
