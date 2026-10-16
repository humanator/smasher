// ABOUTME: Guards the design system: components use theme tokens, never raw colours or font sizes
// ABOUTME: Scans the primitives, the shell and the dashboard/run components for hex, rgba and palette classes

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC = join(process.cwd(), 'src');

// The editor still styles nodes from nodeConfig.ts hex values; its rebuild (CAPABILITY_MAP.md `editor`
// module) moves it onto stepKinds, and then it joins this list.
const SCANNED = ['lib/components/ui', 'components/shell', 'components/dashboard', 'components/design'];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(svelte|ts|css)$/.test(name) ? [path] : [];
  });
}

// Comments may quote a board value; only code counts.
function code(source: string): string {
  return source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const RULES: [name: string, pattern: RegExp][] = [
  ['hex colour', /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/],
  ['rgb()/rgba()', /\brgba?\(/],
  [
    'Tailwind palette colour',
    /\b(?:text|bg|border|ring|fill|stroke|divide|outline|from|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/,
  ],
  ['raw black/white alpha', /\b(?:bg|text|border|ring|shadow)-(?:black|white)\/[\d.[\]]+/],
  ['arbitrary font size', /\btext-\[\d+(?:\.\d+)?px\]/],
];

const scanned = SCANNED.flatMap((dir) => files(join(SRC, dir)));

describe('design-system tokens only', () => {
  it('scans the expected folders', () => {
    expect(scanned.length).toBeGreaterThan(100);
  });

  it.each(RULES)('no %s in components', (_name, pattern) => {
    const offenders = scanned.flatMap((path) =>
      code(readFileSync(path, 'utf-8'))
        .split('\n')
        .map((line, i) => [line, i] as const)
        .filter(([line]) => pattern.test(line))
        .map(([line, i]) => `${relative(SRC, path)}:${i + 1}: ${line.trim().slice(0, 120)}`)
    );
    expect(offenders).toEqual([]);
  });
});
