// ABOUTME: Tests for the theme tokens in app.css
// ABOUTME: Parses the real stylesheet and checks every required pair meets WCAG AA in light and dark

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { contrastRatio } from '../../src/lib/contrast';

const css = readFileSync(join(process.cwd(), 'src', 'app.css'), 'utf-8');
const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  expect(start, `${selector} block`).toBeGreaterThanOrEqual(0);
  const end = css.indexOf('\n}', start);
  const tokens: Record<string, string> = {};
  for (const m of css.slice(start, end).matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

const themes = { light: block(':root'), dark: block('.dark') };

const REQUIRED_TOKENS = [
  'background', 'foreground', 'muted', 'muted-foreground', 'sidebar', 'sidebar-foreground',
  'sidebar-muted-foreground', 'sidebar-accent', 'primary', 'primary-foreground', 'primary-subtle',
  'primary-subtle-foreground', 'secondary', 'destructive', 'destructive-subtle', 'success', 'info',
  'border', 'input', 'ring',
];

// [foreground token, background token]
const PAIRS: [string, string][] = [
  ['foreground', 'background'],
  ['foreground', 'muted'],
  ['foreground', 'sidebar'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'muted'],
  ['sidebar-muted-foreground', 'sidebar'],
  ['primary-foreground', 'primary'],
  ['primary-subtle-foreground', 'primary-subtle'],
  ['destructive', 'background'],
  ['destructive', 'destructive-subtle'],
];

describe.each(Object.entries(themes))('%s tokens', (_name, tokens) => {
  it.each(REQUIRED_TOKENS)('defines --%s', (token) => {
    expect(tokens[`--${token}`]).toBeDefined();
  });

  it.each(PAIRS)('%s on %s meets 4.5:1', (fg, bg) => {
    const ratio = contrastRatio(tokens[`--${fg}`], tokens[`--${bg}`], tokens['--background']);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

// Text the dashboard puts on its own backgrounds: [foreground, background, surface under a
// translucent background]. Badges sit on both the plain and the zebra-striped table rows.
// Accent text switches to primary-subtle-foreground in dark, where the pink is too dim.
const ACCENT_TEXT = { light: 'primary', dark: 'primary-subtle-foreground' };
const DASHBOARD_PAIRS: [string | typeof ACCENT_TEXT, string, string][] = [
  ['foreground', 'primary-subtle', 'background'], // needs-you banner title
  ['primary-subtle-foreground', 'primary-subtle', 'background'], // banner detail and "+ N more" link
  ['secondary-foreground', 'secondary', 'card'], // Running / Completed / Aborted / Key saved badges
  ['secondary-foreground', 'secondary', 'muted'],
  ['primary-foreground', 'primary', 'card'], // Needs you badge, banner button
  ['destructive', 'destructive-subtle', 'card'], // Failed badge
  ['destructive', 'destructive-subtle', 'muted'],
  ['foreground', 'card', 'card'], // outline badges: No runs yet, No key
  ['foreground', 'muted', 'muted'],
  [ACCENT_TEXT, 'popover', 'popover'], // Reset to Default link in Settings
  [ACCENT_TEXT, 'muted', 'muted'], // selected Settings tab
];

describe.each(Object.entries(themes))('%s dashboard colours', (name, tokens) => {
  it.each(DASHBOARD_PAIRS)('%o on %s (over %s) meets 4.5:1', (fg, bg, surface) => {
    const token = typeof fg === 'string' ? fg : fg[name as keyof typeof ACCENT_TEXT];
    const ratio = contrastRatio(tokens[`--${token}`], tokens[`--${bg}`], tokens[`--${surface}`]);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

describe('light token values from the spec', () => {
  it.each([
    ['background', '#FFFFFF'],
    ['foreground', '#1D1D1F'],
    ['sidebar', '#EBEBEE'],
    ['primary', '#BE185D'],
    ['destructive', '#C4170F'],
  ])('--%s is %s', (token, value) => {
    expect(themes.light[`--${token}`].toUpperCase()).toBe(value);
  });
});

describe('typography', () => {
  it('uses the system font stack', () => {
    expect(css).toMatch(/--font-sans:\s*-apple-system, BlinkMacSystemFont, system-ui, sans-serif/);
  });

  it('no longer imports the Manrope or Figtree fonts', () => {
    expect(css).not.toMatch(/fontsource/);
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })).not.toContainEqual(
      expect.stringMatching(/^@fontsource/)
    );
  });
});
