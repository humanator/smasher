// ABOUTME: Keeps what was typed into each workflow's run dialog until the page reloads
// ABOUTME: A plain module-level Map; the dialog copies a draft into its own state on open

import type { RunFormValues } from './runRequest';

const drafts = new Map<string, RunFormValues>();

export function getDraft(workflowId: string): RunFormValues {
  const draft = drafts.get(workflowId);
  return draft ? { ...draft } : { model: '', variables: '', brief: '', nodeOverrides: '' };
}

// Stores a copy, so the caller's later edits don't leak into the saved draft.
export function saveDraft(workflowId: string, values: RunFormValues): void {
  drafts.set(workflowId, { ...values });
}
