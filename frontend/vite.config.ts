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
  // App.svelte lazy-loads the node editor, so the dev server's startup scan
  // no longer sees these two. Left to runtime discovery, the first editor
  // visit re-optimizes them and force-reloads every open page -- which
  // breaks whatever Playwright tests are mid-flight on a cold cache (CI).
  optimizeDeps: {
    include: ['@xyflow/svelte', '@dagrejs/dagre'],
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
