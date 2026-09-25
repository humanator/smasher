// ABOUTME: Run-status helpers shared by the run page and the workflow page
// ABOUTME: Which statuses are terminal, and which of a workflow's runs its card features

import type { RunSummary } from './api/runs';

export const TERMINAL_STATUSES = new Set(['Completed', 'Failed', 'Aborted']);

export function isActive(status: string): boolean {
  return !TERMINAL_STATUSES.has(status);
}

export interface FeaturedRun {
  run: RunSummary;
  heading: 'Active run' | 'Latest run';
  moreRunning: number;
}

// Expects runs newest-first, as the server lists them. Features the newest
// running run if there is one, otherwise the newest run of any status.
export function pickFeaturedRun(runs: RunSummary[]): FeaturedRun | null {
  const running = runs.filter((r) => isActive(r.status));
  if (running.length > 0) {
    return { run: running[0], heading: 'Active run', moreRunning: running.length - 1 };
  }
  if (runs.length === 0) return null;
  return { run: runs[0], heading: 'Latest run', moreRunning: 0 };
}
