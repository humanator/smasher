// ABOUTME: Tests for the Recent runs filter and its ?runs= query parameter
// ABOUTME: Pure function tests: parsing every value of ?runs= and building the URL back

import { describe, it, expect } from 'vitest';
import { parseRunFilter, runFilterHref } from '../../src/lib/runFilter';

describe('parseRunFilter', () => {
  it.each(['all', 'active', 'completed', 'failed'] as const)('reads ?runs=%s', (filter) => {
    expect(parseRunFilter(`?runs=${filter}`)).toEqual({ filter, needsYouFirst: false });
  });

  it('reads ?runs=needs-you as Active with needs-you runs first', () => {
    expect(parseRunFilter('?runs=needs-you')).toEqual({ filter: 'active', needsYouFirst: true });
  });

  it('falls back to All with no ?runs=', () => {
    expect(parseRunFilter('')).toEqual({ filter: 'all', needsYouFirst: false });
    expect(parseRunFilter('?other=1')).toEqual({ filter: 'all', needsYouFirst: false });
  });

  it('falls back to All for an unknown or empty value', () => {
    expect(parseRunFilter('?runs=garbage')).toEqual({ filter: 'all', needsYouFirst: false });
    expect(parseRunFilter('?runs=')).toEqual({ filter: 'all', needsYouFirst: false });
    expect(parseRunFilter('?runs=ACTIVE')).toEqual({ filter: 'all', needsYouFirst: false });
  });

  it('accepts a search string without the leading ?', () => {
    expect(parseRunFilter('runs=failed')).toEqual({ filter: 'failed', needsYouFirst: false });
  });
});

describe('runFilterHref', () => {
  it.each(['active', 'completed', 'failed'] as const)('puts %s in ?runs=', (filter) => {
    expect(runFilterHref(filter)).toBe(`/?runs=${filter}`);
  });

  it('drops ?runs= for All so the plain URL stays clean', () => {
    expect(runFilterHref('all')).toBe('/');
  });

  it('round-trips through parseRunFilter', () => {
    for (const filter of ['all', 'active', 'completed', 'failed'] as const) {
      const search = runFilterHref(filter).slice(1);
      expect(parseRunFilter(search).filter).toBe(filter);
    }
  });
});
