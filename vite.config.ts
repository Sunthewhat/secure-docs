import path from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy any request starting with /api to the external API
      '/api': {
        target: 'https://easy-cert-api.sunthewhat.com/api/v1',
        changeOrigin: true,
        secure: false, // if the API is https
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});