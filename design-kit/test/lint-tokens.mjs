// ABOUTME: Static check that components.css only uses token variables for colors,
// ABOUTME: radii, and spacing — fails on raw hex/rgb colors or magic px/rem numbers.
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.resolve(__dirname, '../components.css');

// Properties where a bare size number should be a var(--token) instead.
const SPACING_PROPERTIES = new Set([
  'color', 'background', 'background-color', 'border-color',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'outline', 'outline-color', 'box-shadow', 'border-radius',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'gap', 'row-gap', 'column-gap', 'font-size',
]);

// Raw values allowed without a token (e.g. hairline borders).
const ALLOWED_RAW_VALUES = new Set(['1px', '0', '0px']);

const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/;
const RAW_COLOR_FN = /\b(rgb|rgba|hsl|hsla)\(/;
const SIZE_TOKEN = /\b\d+(?:\.\d+)?(?:px|rem|em)\b/g;

export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

export function findDeclarations(css) {
  const declarations = [];
  const ruleBodies = css.match(/\{[^{}]*\}/g) ?? [];
  for (const body of ruleBodies) {
    const inner = body.slice(1, -1);
    for (const raw of inner.split(';')) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;
      const property = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();
      declarations.push({ property, value });
    }
  }
  return declarations;
}

export function lint(css) {
  const violations = [];
  for (const { property, value } of findDeclarations(stripComments(css))) {
    if (HEX_COLOR.test(value)) {
      violations.push(`${property}: ${value} — raw hex color, use a var(--token) instead`);
      continue;
    }
    if (RAW_COLOR_FN.test(value)) {
      violations.push(`${property}: ${value} — raw color function, use a var(--token) instead`);
      continue;
    }
    if (SPACING_PROPERTIES.has(property)) {
      const sizeMatches = value.match(SIZE_TOKEN) ?? [];
      for (const match of sizeMatches) {
        if (!ALLOWED_RAW_VALUES.has(match)) {
          violations.push(`${property}: ${value} — raw size "${match}", use a var(--token) instead`);
        }
      }
    }
  }
  return violations;
}

function main() {
  const css = readFileSync(cssPath, 'utf8');
  const violations = lint(css);

  if (violations.length > 0) {
    console.error(`lint-tokens: ${violations.length} violation(s) in ${path.relative(process.cwd(), cssPath)}`);
    for (const v of violations) console.error(`  - ${v}`);
    process.exit(1);
  }

  console.log(`lint-tokens: ${path.relative(process.cwd(), cssPath)} — no raw-value violations`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
