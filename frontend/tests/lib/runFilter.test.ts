// ABOUTME: Tests for the Recent runs filter and its ?runs= query parameter
// ABOUTME: Pure function tests: parsing ?runs=, building the /runs URL back, and redirecting the old home-page addresses

import { describe, it, expect } from 'vitest';
import { legacyRunsRedirect, parseRunFilter, runFilterHref } from '../../src/lib/runFilter';

describe('parseRunFilter', () => {
  it.each(['all', 'active', 'completed', 'failed'] as const)('reads ?runs=%s', (filter) => {
    expect(parseRunFilter(`?runs=${filter}`)).toBe(filter);
  });

  it('falls back to All with no ?runs=', () => {
    expect(parseRunFilter('')).toBe('all');
    expect(parseRunFilter('?other=1')).toBe('all');
  });

  it('falls back to All for an unknown or empty value', () => {
    expect(parseRunFilter('?runs=garbage')).toBe('all');
    expect(parseRunFilter('?runs=')).toBe('all');
    expect(parseRunFilter('?runs=ACTIVE')).toBe('all');
  });

  it('falls back to All for needs-you, which has its own screen now', () => {
    expect(parseRunFilter('?runs=needs-you')).toBe('all');
  });

  it('accepts a search string without the leading ?', () => {
    expect(parseRunFilter('runs=failed')).toBe('failed');
  });
});

describe('runFilterHref', () => {
  it.each(['active', 'completed', 'failed'] as const)('puts %s in ?runs= on /runs', (filter) => {
    expect(runFilterHref(filter)).toBe(`/runs?runs=${filter}`);
  });

  it('drops ?runs= for All so the plain URL stays clean', () => {
    expect(runFilterHref('all')).toBe('/runs');
  });

  it('round-trips through parseRunFilter', () => {
    for (const filter of ['all', 'active', 'completed', 'failed'] as const) {
      const search = new URL(runFilterHref(filter), 'http://localhost').search;
      expect(parseRunFilter(search)).toBe(filter);
    }
  });
});

describe('legacyRunsRedirect', () => {
  it.each([
    ['/', '', '#runs', '/runs'],
    ['/', '?runs=failed', '#runs', '/runs?runs=failed'],
    ['/', '?runs=active', '', '/runs?runs=active'],
    ['/', '?runs=all', '#runs', '/runs'],
    ['/', '?runs=garbage', '#runs', '/runs'],
    ['/', '?runs=needs-you', '#runs', '/needs-you'],
    ['/', '?runs=needs-you', '', '/needs-you'],
    ['/runs', '?runs=needs-you', '', '/needs-you'],
  ])('sends %s%s%s to %s', (pathname, search, hash, target) => {
    expect(legacyRunsRedirect(pathname, search, hash)).toBe(target);
  });

  it.each([
    ['/', '', ''],
    ['/', '?other=1', ''],
    ['/runs', '?runs=failed', ''],
    ['/runs', '', ''],
    ['/needs-you', '', ''],
    ['/workflows/some-id', '?runs=failed', '#runs'],
    ['/runs/some-run', '', '#runs'],
  ])('leaves %s%s%s alone', (pathname, search, hash) => {
    expect(legacyRunsRedirect(pathname, search, hash)).toBeNull();
  });
});
