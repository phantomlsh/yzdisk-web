import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [vue({ reactivityTransform: true })],
  server: {
    proxy: {
      '/yzdisk': {
        target: 'https://s.yzzx.org/yzdisk',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/yzdisk/, '')
      },
    }
  }
})
