import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // No Docker passamos BACKEND_URL=http://backend:3000. Fora do Docker usa localhost:3000
  const backendTarget = process.env.BACKEND_URL || env.BACKEND_URL || 'http://localhost:3000';

  const proxyConfig = {
    '/api': {
      target: backendTarget,
      changeOrigin: true,
    },
    '/login': {
      target: backendTarget,
      changeOrigin: true,
    },
    '/logout': {
      target: backendTarget,
      changeOrigin: true,
    },
    '/oauth': {
      target: backendTarget,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: proxyConfig,
    },
    preview: {
      host: '0.0.0.0',
      port: 5173,
      proxy: proxyConfig,
    },
  };
})

