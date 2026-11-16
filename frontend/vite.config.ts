import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { lucideIconImports } from './vite.lucide-icons';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
    },
  },
  // App.svelte lazy-loads the node editor, the Run sheet and Settings, so the dev
  // server's startup scan misses what only they import. Left to runtime discovery,
  // the first visit re-optimizes those deps and force-reloads every open page --
  // which closes the dialog just opened and breaks Playwright tests on a cold cache.
  // Every Lucide icon under src is listed, so a new icon can't bring that back.
  optimizeDeps: {
    include: ['@xyflow/svelte', '@dagrejs/dagre', ...lucideIconImports(path.resolve('./src'))],
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
