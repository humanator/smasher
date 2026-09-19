import { resolve } from 'node:path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
//
// `vite dev` (local preview, index.html/main.ts) ignores `build.lib` --
// only `vite build` uses it, compiling WorkflowCanvas.svelte to a single
// <workflow-canvas> custom-element bundle that smasher-web serves as a
// static asset. `compilerOptions.customElement: true` is what makes a
// `<svelte:options customElement={...}>` component actually register
// itself as a custom element rather than compile to a normal Svelte
// component class.
export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true,
      },
    }),
  ],
  // `@xyflow/svelte` (bundled into this lib build) branches on
  // `process.env.NODE_ENV` internally (dev-only warnings/attribution
  // logic). Vite's `build.lib` mode -- unlike its regular app build --
  // does not automatically strip/replace that reference, so the compiled
  // `dist/workflow-canvas.js` throws `ReferenceError: process is not
  // defined` the moment a real browser (no Node global) loads it as a
  // plain `<script type="module">` -- confirmed via a real-Chromium check
  // while wiring this bundle into smasher-web's pages (Task 5); `npm run
  // dev`'s Vite dev server never hits this because it serves unbundled
  // ESM with its own runtime shims, which is why Task 4's own dev-server
  // Playwright check didn't catch it. This `define` statically replaces
  // every `process.env.NODE_ENV` reference at build time, same as Vite's
  // app-mode build already does for you.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/WorkflowCanvas.svelte'),
      name: 'WorkflowCanvas',
      fileName: () => 'workflow-canvas.js',
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
  },
})
