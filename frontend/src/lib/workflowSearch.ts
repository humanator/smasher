// ABOUTME: The dashboard's workflow search: matches a query against the display title and the file name
// ABOUTME: Shared by the workflows table and the toolbar subtitle, so both count the same rows

import type { WorkflowSummary } from './api/workflows';
import { formatWorkflowName } from './utils';

/** Workflows whose title or file name contains `query`, ignoring case and surrounding spaces. */
export function filterWorkflows<T extends Pick<WorkflowSummary, 'name'>>(workflows: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return workflows;
  return workflows.filter(
    (w) => formatWorkflowName(w.name).toLowerCase().includes(needle) || w.name.toLowerCase().includes(needle)
  );
}
