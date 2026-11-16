// ABOUTME: Tests that the dev server pre-bundles every Lucide icon the app imports
// ABOUTME: An icon left to runtime discovery makes Vite reload the page the first time a lazy screen uses it

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { lucideIconImports } from '../../vite.lucide-icons';

const SRC = join(process.cwd(), 'src');

function iconsInSource(dir: string, found = new Set<string>()): Set<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) iconsInSource(path, found);
    else for (const m of readFileSync(path, 'utf-8').matchAll(/@lucide\/svelte\/icons\/[a-z0-9-]+/g)) found.add(m[0]);
  }
  return found;
}

describe('Lucide icon pre-bundling', () => {
  it('finds the icons only lazy screens use', () => {
    const icons = lucideIconImports(SRC);
    expect(icons).toContain('@lucide/svelte/icons/chevrons-up-down');
    expect(icons).toContain('@lucide/svelte/icons/key-round');
  });

  it('finds every icon imported under src', () => {
    expect(lucideIconImports(SRC)).toEqual([...iconsInSource(SRC)].sort());
  });

  // Importing vite.config here would pull Vite into jsdom, so check its source instead.
  it('pre-bundles what it finds via optimizeDeps.include', () => {
    const config = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf-8');
    expect(config).toMatch(/optimizeDeps:\s*{\s*include:\s*\[[^\]]*\.\.\.lucideIconImports\(path\.resolve\('\.\/src'\)\)/);
  });
});
