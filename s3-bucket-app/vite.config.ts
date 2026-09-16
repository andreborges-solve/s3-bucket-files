import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
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

  //config para permitir acesso externo
  const allowedHosts = [
    'upload-redeamericas.s4me.app',
    'localhost',
    '127.0.0.1',
  ];

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts,
      proxy: proxyConfig,
    },
    preview: {
      host: '0.0.0.0',
      port: 80,
      allowedHosts,
      proxy: proxyConfig,
    },
  };
})

