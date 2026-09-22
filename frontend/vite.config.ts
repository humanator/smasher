import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:21541',
        changeOrigin: true,
      },
      '/events': {
        target: 'http://127.0.0.1:21541',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'ES2020',
    minify: 'terser',
    outDir: 'dist',
  },
  preview: {
    port: 5173,
  },
});
