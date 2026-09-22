import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
  resolve: {
    // Without this, Vite resolves Svelte's server-side build under Vitest
    // (no `mount`, onMount never fires) instead of the client build --
    // this only applies to the Vitest process, not `vite build`/`vite dev`.
    conditions: process.env.VITEST ? ['browser'] : undefined,
    alias: {
      $lib: path.resolve('./src/lib'),
      $components: path.resolve('./src/components'),
      $stores: path.resolve('./src/stores'),
    },
  },
});
