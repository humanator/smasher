// ABOUTME: Tests for the coarse-pointer hit-area rule in app.css
// ABOUTME: jsdom has no layout, so this checks the rule's selectors and 44px size in the real stylesheet

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const css = readFileSync(join(process.cwd(), 'src', 'app.css'), 'utf-8');

function coarseBlock(): string {
  const start = css.indexOf('@media (pointer: coarse)');
  expect(start, '@media (pointer: coarse) block').toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1);
  }
  throw new Error('unterminated coarse block');
}

describe('coarse pointer hit areas', () => {
  const block = coarseBlock();

  it.each([
    'button',
    'checkbox',
    'switch',
    'tabs-trigger',
    'toggle-group-item',
    'accordion-trigger',
  ])('grows the %s hit area with a 44px pseudo-element', (slot) => {
    expect(block).toContain(`[data-slot="${slot}"]`);
  });

  it('sizes the hit area at least 44px each way', () => {
    expect(block).toMatch(/min-width:\s*44px/);
    expect(block).toMatch(/min-height:\s*44px/);
  });

  it('lifts text fields to 44px tall rather than using a pseudo-element', () => {
    expect(block).toMatch(/\[data-slot="input"\][^{}]*\{[^}]*min-height:\s*44px/);
  });

  it('leaves the desktop rules outside the media query', () => {
    const outside = css.replace(block, '');
    expect(outside).not.toMatch(/min-height:\s*44px/);
  });
});
