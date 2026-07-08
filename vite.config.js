import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import jsconfigPaths from 'vite-jsconfig-paths'
import eslint from 'vite-plugin-eslint';
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), jsconfigPaths(), svgr(), eslint()],
  server: {
    proxy: {
      '/pdf-proxy': {
        target: 'https://lims.kailtech.in',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/pdf-proxy/, ''),
      }
    }
  }
})
