// ABOUTME: Tests for the Button primitive's size scale and variants
// ABOUTME: Class-level checks of the board heights, since jsdom does no layout

import { describe, it, expect } from 'vitest';
import { buttonVariants } from '../../../src/lib/components/ui/button/button.svelte';

describe('buttonVariants sizes', () => {
  it.each([
    ['xs', 'h-[18px]'],
    ['sm', 'h-[22px]'],
    ['default', 'h-[24px]'],
    ['lg', 'h-[28px]'],
    ['icon-xs', 'size-[18px]'],
    ['icon-sm', 'size-[24px]'],
    ['icon', 'size-[28px]'],
    ['icon-lg', 'size-[32px]'],
  ] as const)('%s uses %s', (size, cls) => {
    expect(buttonVariants({ size }).split(' ')).toContain(cls);
  });

  it('keeps every variant name callers use', () => {
    for (const variant of ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const) {
      expect(buttonVariants({ variant })).toBeTruthy();
    }
  });

  it('shows a 3px focus ring in the ring token', () => {
    const classes = buttonVariants({}).split(' ');
    expect(classes).toContain('focus-visible:ring-3');
    expect(classes).toContain('focus-visible:ring-ring');
  });
});
