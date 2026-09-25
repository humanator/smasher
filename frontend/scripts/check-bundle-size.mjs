// ABOUTME: Fails the build check when dist/assets holds a JS chunk over 500 kB or only one JS chunk
// ABOUTME: Run after `vite build` (see `npm run build:check`); CI uses it so a bundle regression turns the job red

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Same limit and unit (1 kB = 1000 bytes) as Vite's own chunkSizeWarningLimit
// check, so this fails exactly where `vite build` would start warning.
const LIMIT_KB = 500;
const assetsDir = join(import.meta.dirname, '..', 'dist', 'assets');

const chunks = readdirSync(assetsDir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => ({ name, kb: statSync(join(assetsDir, name)).size / 1000 }));

const problems = [];
// A single chunk means the node editor (and @xyflow/svelte + dagre with it)
// is back in the entry bundle, even if it happens to squeeze under the limit.
if (chunks.length < 2) {
  problems.push(`expected the node editor in its own chunk, found ${chunks.length} JS chunk(s)`);
}
for (const { name, kb } of chunks) {
  if (kb > LIMIT_KB) problems.push(`${name} is ${kb.toFixed(2)} kB (limit ${LIMIT_KB} kB)`);
}

if (problems.length > 0) {
  console.error('Bundle size check failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`Bundle size check passed: ${chunks.length} JS chunks, all under ${LIMIT_KB} kB.`);
