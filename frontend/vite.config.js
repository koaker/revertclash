import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // 将所有 /api 的请求代理到你的后端服务器
      '/api': {
        target: 'http://localhost:3000', // 你的后端服务地址
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // 注意：这里我们不需要重写路径，因为前端请求的 /auth/login
        // 正好对应后端的 /auth/login
      },
      // 添加订阅路由的代理
      '/subscribe': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
})
