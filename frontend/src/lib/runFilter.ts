// ABOUTME: The Recent runs filter and its ?runs= query parameter
// ABOUTME: Parses ?runs= into a filter (needs-you selects Active, needs-you first) and builds the URL back

import type { RunGroup } from './runStatus';

export type RunFilter = 'all' | RunGroup;

export interface ParsedRunFilter {
  filter: RunFilter;
  /** Set by the sidebar's ?runs=needs-you: show Active, with runs waiting on a person first. */
  needsYouFirst: boolean;
}

const FILTERS: readonly RunFilter[] = ['all', 'active', 'completed', 'failed'];

function isRunFilter(value: string | null): value is RunFilter {
  return FILTERS.includes(value as RunFilter);
}

export function parseRunFilter(search: string): ParsedRunFilter {
  const value = new URLSearchParams(search).get('runs');
  if (value === 'needs-you') return { filter: 'active', needsYouFirst: true };
  return { filter: isRunFilter(value) ? value : 'all', needsYouFirst: false };
}

export function runFilterHref(filter: RunFilter): string {
  return filter === 'all' ? '/' : `/?runs=${filter}`;
}
