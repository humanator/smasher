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
