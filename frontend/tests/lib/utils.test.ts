// ABOUTME: Tests for cn(), checking it merges the app's own type, shadow and radius tokens
// ABOUTME: Unknown names would be misread as colours and silently dropped when a colour follows

import { describe, it, expect } from 'vitest';
import { cn } from '../../src/lib/utils';

describe('cn with design-system tokens', () => {
  it.each(['caption', 'hint', 'small', 'body', 'heading', 'display'])(
    'keeps text-%s beside a text colour',
    (size) => {
      expect(cn(`text-${size}`, 'text-muted-foreground')).toBe(`text-${size} text-muted-foreground`);
    }
  );

  it('lets a later type size replace an earlier one', () => {
    expect(cn('text-body', 'text-caption')).toBe('text-caption');
    expect(cn('text-sm', 'text-body')).toBe('text-body');
  });

  it('treats shadow tokens as shadows, not shadow colours', () => {
    expect(cn('shadow-push', 'shadow-none')).toBe('shadow-none');
    expect(cn('shadow-card', 'shadow-sheet')).toBe('shadow-sheet');
  });

  it('treats rounded-track as a radius', () => {
    expect(cn('rounded-md', 'rounded-track')).toBe('rounded-track');
  });
});

describe('tv with design-system tokens', () => {
  it('keeps the type size when a variant sets the text colour', async () => {
    const { tv } = await import('../../src/lib/utils');
    const variants = tv({ base: 'text-body text-foreground', variants: { v: { a: 'text-primary' } } });
    expect(variants({ v: 'a' })).toBe('text-body text-primary');
  });
});

describe('cn accepts every Svelte class value', () => {
  it('joins objects, arrays, numbers and drops falsy values like clsx', () => {
    expect(cn('a', { b: true, c: false }, ['d', ['e', null]], undefined, false, 0, 'f')).toBe('a b d e f');
  });

  it('still merges conflicts after joining', () => {
    expect(cn({ 'px-2': true }, ['px-4'])).toBe('px-4');
  });
});
