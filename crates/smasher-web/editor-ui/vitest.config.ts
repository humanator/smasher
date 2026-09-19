import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts because that file's `build.lib` entry
// (single .svelte file, custom-element compiler output) isn't a shape
// Vitest needs or wants -- this config only adds what tests need: jsdom
// (Svelte Flow measures DOM nodes) and a setup file for jest-dom matchers.
export default defineConfig({
  plugins: [svelte({ compilerOptions: { customElement: true } })],
  // Without this, Vite's default Node export-condition resolution picks
  // svelte's server build (`svelte/src/index-server.js`, no `mount()`)
  // even under jsdom -- a well-known Vitest+Svelte gotcha, not specific
  // to this component.
  resolve: {
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testSetup.ts'],
  },
})
