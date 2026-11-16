// ABOUTME: Lists every @lucide/svelte/icons/* module imported under a source directory
// ABOUTME: vite.config pre-bundles them all, so a lazily loaded screen never triggers a dev-server reload

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ICON = /@lucide\/svelte\/icons\/[a-z0-9-]+/g;

/** Every Lucide icon module imported by a .svelte/.ts/.js file under `dir`, sorted. */
export function lucideIconImports(dir: string): string[] {
  const found = new Set<string>();
  const walk = (current: string) => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(svelte|ts|js)$/.test(name)) {
        for (const match of readFileSync(path, 'utf-8').matchAll(ICON)) found.add(match[0]);
      }
    }
  };
  walk(dir);
  return [...found].sort();
}
