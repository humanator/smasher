// ABOUTME: Run-status helpers shared by the dashboard, workflow page and run page
// ABOUTME: Which statuses are terminal, how runs group for filters, how each status is badged, and a workflow's status

import type { RunSummary } from './api/runs';
import type { WorkflowSummary } from './api/workflows';
import type { BadgeVariant } from './components/ui/badge/index.js';
import { formatWhen } from './timeFormat';
import { formatWorkflowName } from './utils';

export const TERMINAL_STATUSES = new Set(['Completed', 'Failed', 'Aborted']);

export function isActive(status: string): boolean {
  return !TERMINAL_STATUSES.has(status);
}

/** A run that is blocked on a person: still running, with questions waiting. */
export function isNeedsYou(run: RunSummary): boolean {
  return run.status === 'Running' && run.pending_questions > 0;
}

/** What to call a run: its workflow's title, else its graph's name, else "Unnamed workflow". */
export function runTitle(run: RunSummary, workflows: readonly WorkflowSummary[]): string {
  const workflow = run.workflow_id ? workflows.find((w) => w.id === run.workflow_id) : undefined;
  if (workflow) return formatWorkflowName(workflow.name);
  return run.graph_name?.trim() || 'Unnamed workflow';
}

/** The run that has waited on a person longest. Runs without a `waiting_since` come last. */
export function longestWaiting(runs: readonly RunSummary[]): RunSummary | null {
  let best: RunSummary | null = null;
  for (const run of runs) {
    if (!best) best = run;
    else if (run.waiting_since && (!best.waiting_since || Date.parse(run.waiting_since) < Date.parse(best.waiting_since))) best = run;
  }
  return best;
}

export type RunGroup = 'active' | 'completed' | 'failed';

export function runGroup(status: string): RunGroup {
  if (status === 'Completed') return 'completed';
  if (status === 'Failed' || status === 'Aborted') return 'failed';
  return 'active';
}

export type WorkflowStatusLabel = 'Needs you' | 'No runs yet';

export interface StatusBadgeSpec {
  label: string;
  variant: BadgeVariant;
  /** CSS colour for the leading dot, from the theme tokens; none for accent, outline and Failed badges. */
  dot: string | undefined;
}

// The one place a status turns into a badge; the dashboard, workflow page and run page share it.
export function statusBadge(status: string): StatusBadgeSpec {
  switch (status) {
    case 'Needs you':
      return { label: status, variant: 'default', dot: undefined };
    case 'No runs yet':
      return { label: status, variant: 'outline', dot: undefined };
    case 'Completed':
      return { label: status, variant: 'secondary', dot: 'var(--success)' };
    case 'Failed':
      return { label: status, variant: 'destructive', dot: undefined };
    case 'Aborted':
      return { label: status, variant: 'secondary', dot: 'var(--foreground-tertiary)' };
    default:
      return { label: status, variant: 'secondary', dot: 'var(--info)' };
  }
}

export interface WorkflowStatus {
  status: string;
  lastActivity: string;
}

// "Today, 10:42 am" reads as "since today, 10:42 am" mid-sentence.
function midSentence(when: string): string {
  return when.replace(/^(Today|Yesterday)/, (word) => word.toLowerCase());
}

// Expects runs newest-first, as the server lists them. The first matching rule
// wins: needs you, then running, then the latest run's own status.
export function workflowStatus(
  workflowId: string,
  runs: RunSummary[],
  now: Date,
  timeZone?: string
): WorkflowStatus {
  const own = runs.filter((r) => r.workflow_id === workflowId);
  if (own.length === 0) return { status: 'No runs yet', lastActivity: '—' };

  const needsYou = own.filter(isNeedsYou);
  if (needsYou.length > 0) {
    // RFC3339 UTC strings sort chronologically, so the first is the longest wait.
    const since = needsYou
      .map((r) => r.waiting_since)
      .filter((s): s is string => s !== null)
      .sort()[0];
    return {
      status: 'Needs you',
      lastActivity: since ? `Waiting since ${midSentence(formatWhen(since, now, timeZone))}` : '—',
    };
  }

  const active = own.find((r) => isActive(r.status));
  if (active) {
    return { status: 'Running', lastActivity: `Since ${midSentence(formatWhen(active.started_at, now, timeZone))}` };
  }

  const latest = own[0];
  return { status: latest.status, lastActivity: formatWhen(latest.completed_at ?? latest.started_at, now, timeZone) };
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
