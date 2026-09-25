import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
    },
  },
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
      '/candidate-artifacts': {
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
