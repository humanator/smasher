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
  // Board values with no shadcn equivalent (audit 2026-10-16)
  'foreground-secondary', 'foreground-control', 'foreground-tertiary', 'warning', 'warning-foreground',
  'success-foreground', 'info-foreground', 'success-subtle', 'success-border', 'destructive-surface',
  'destructive-border', 'invalid', 'invalid-ring', 'ring-field', 'primary-subtle-border', 'neutral',
  'tooltip', 'sheet', 'sheet-toolbar', 'control', 'segment', 'field', 'field-fill', 'fill-pressed',
  'track', 'group', 'separator', 'border-strong', 'divider', 'scrim', 'scrim-strong', 'scrim-faint',
  // Shadows, so primitives never paste rgba strings
  'elevation-push', 'elevation-push-accent', 'elevation-segment', 'elevation-field', 'elevation-thumb',
  'elevation-check', 'elevation-tooltip', 'elevation-popover', 'elevation-card', 'elevation-sheet',
  'elevation-dialog', 'elevation-window', 'elevation-hairline',
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
  ['destructive', 'destructive-surface'],
  ['foreground-secondary', 'background'],
  ['foreground-secondary', 'muted'],
  ['foreground-control', 'background'],
  ['foreground-control', 'sidebar'],
  ['foreground', 'sheet'],
  ['foreground', 'sheet-toolbar'],
  ['muted-foreground', 'sheet'],
  ['foreground-secondary', 'sheet-toolbar'], // board #6E6E73 is 4.46:1 here, so toolbar labels use secondary
  ['foreground', 'tooltip'],
  ['success-foreground', 'background'],
  ['success-foreground', 'success-subtle'],
  ['success-foreground', 'sheet'],
  ['warning-foreground', 'background'],
  ['info-foreground', 'background'],
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
  ['primary-foreground', 'primary', 'primary-subtle'], // Needs you badge on the workflow page's active-run banner
  ['destructive', 'destructive-subtle', 'card'], // Failed badge
  ['destructive', 'destructive-subtle', 'muted'],
  ['destructive', 'card', 'card'], // a failed run's reason in the workflow page's run history
  ['destructive', 'muted', 'muted'],
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

describe('light board values with no shadcn token', () => {
  it.each([
    ['foreground-secondary', '#3A3A3C'],
    ['foreground-control', '#4A4A4F'],
    ['foreground-tertiary', '#8E8E93'],
    ['warning', '#FF9500'],
    ['warning-foreground', '#B25000'],
    ['success-foreground', '#1F8136'], // board #248A3D fails AA (4.40:1); nearest passing shade
    ['info-foreground', '#0060DF'],
    ['invalid', '#FF3B30'],
    ['tooltip', '#F6F6F6'],
    ['sheet', '#F6F6F8'],
    ['sheet-toolbar', '#F0F0F2'],
  ])('--%s is %s', (token, value) => {
    expect(themes.light[`--${token}`].toUpperCase()).toBe(value);
  });
});

const theme = (() => {
  const start = css.indexOf('@theme inline {');
  const end = css.indexOf('\n}', start);
  const tokens: Record<string, string> = {};
  for (const m of css.slice(start, end).matchAll(/(--[\w-]+):\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
})();

describe('radius scale', () => {
  // Boards: chips 4, segments and tooltips 5, controls 6, tables 8, cards and popovers 10,
  // sheets and windows 12. Each step is a literal so rounded-md is never 4.8px again.
  it.each([
    ['xs', '4px'],
    ['sm', '5px'],
    ['md', '6px'],
    ['lg', '8px'],
    ['xl', '10px'],
    ['2xl', '12px'],
    ['track', '7px'],
  ])('rounded-%s is %s', (step, value) => {
    expect(theme[`--radius-${step}`]).toBe(value);
  });
});

describe('type scale', () => {
  it.each([
    ['caption', '11px'],
    ['hint', '11.5px'],
    ['small', '12px'],
    ['body', '13px'],
    ['heading', '15px'],
    ['display', '20px'],
  ])('text-%s is %s', (step, value) => {
    expect(theme[`--text-${step}`]).toBe(value);
  });
});

describe('layout tokens', () => {
  it('the toolbar and sidebar header are 52px (h-toolbar)', () => {
    expect(theme['--spacing-toolbar']).toBe('52px');
  });
});

describe('shadow utilities', () => {
  it.each(['push', 'push-accent', 'segment', 'field', 'thumb', 'check', 'tooltip', 'popover', 'card', 'sheet', 'dialog', 'window', 'hairline'])(
    'shadow-%s reads its themed elevation token',
    (name) => {
      expect(theme[`--shadow-${name}`]).toBe(`var(--elevation-${name})`);
    }
  );
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
