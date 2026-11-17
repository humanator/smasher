// ABOUTME: The Recent runs filter and its ?runs= query parameter on /runs
// ABOUTME: Parses ?runs= into a filter, builds the URL back, and redirects the home page's old runs addresses

import type { RunGroup } from './runStatus';

export type RunFilter = 'all' | RunGroup;

const FILTERS: readonly RunFilter[] = ['all', 'active', 'completed', 'failed'];

function isRunFilter(value: string | null): value is RunFilter {
  return FILTERS.includes(value as RunFilter);
}

export function parseRunFilter(search: string): RunFilter {
  const value = new URLSearchParams(search).get('runs');
  return isRunFilter(value) ? value : 'all';
}

export function runFilterHref(filter: RunFilter): string {
  return filter === 'all' ? '/runs' : `/runs?runs=${filter}`;
}

/**
 * Where an address from when the runs lived on the home page now goes, or
 * null when it needs no redirect: `/#runs` and `/?runs=<filter>` go to
 * Recent runs with that filter, and `?runs=needs-you` to Needs you.
 */
export function legacyRunsRedirect(pathname: string, search: string, hash: string): string | null {
  const value = new URLSearchParams(search).get('runs');
  if ((pathname === '/' || pathname === '/runs') && value === 'needs-you') return '/needs-you';
  if (pathname === '/' && (hash === '#runs' || value !== null)) return runFilterHref(parseRunFilter(search));
  return null;
}
