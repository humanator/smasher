// ABOUTME: Svelte 5 rune-based store for the sidebar's library: workflows, runs and what needs a person
// ABOUTME: Polls both endpoints while the page is visible; a failed poll keeps the last good data

import { listRuns, type RunSummary } from '$lib/api/runs';
import { listWorkflows, type WorkflowSummary } from '$lib/api/workflows';
import { pollFailureNotifier } from '$lib/notify';
import { isActive, isNeedsYou } from '$lib/runStatus';

export type WorkflowState = 'needs-you' | 'running' | null;

const POLL_MS = 5000;

export function createLibraryStore(intervalMs = POLL_MS) {
  let workflows = $state<WorkflowSummary[]>([]);
  let runs = $state<RunSummary[]>([]);
  const needsYou = $derived(runs.filter(isNeedsYou));
  const pollFailure = pollFailureNotifier('library-poll', 'Failed to load the library');

  let timer: ReturnType<typeof setInterval> | undefined;
  let started = false;

  async function refresh(): Promise<void> {
    try {
      const [workflowList, runList] = await Promise.all([listWorkflows(), listRuns()]);
      workflows = workflowList.workflows;
      runs = runList.runs;
      pollFailure.ok();
    } catch (err) {
      pollFailure.fail(err);
    }
  }

  function startTimer() {
    if (timer === undefined) timer = setInterval(() => void refresh(), intervalMs);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = undefined;
  }

  function onVisibilityChange() {
    if (document.hidden) {
      stopTimer();
    } else {
      void refresh();
      startTimer();
    }
  }

  return {
    get workflows() {
      return workflows;
    },
    get runs() {
      return runs;
    },
    get needsYou() {
      return needsYou;
    },

    workflowState(workflowId: string): WorkflowState {
      const own = runs.filter((r) => r.workflow_id === workflowId);
      if (own.some((r) => needsYou.includes(r))) return 'needs-you';
      if (own.some((r) => isActive(r.status))) return 'running';
      return null;
    },

    refresh,

    start() {
      if (started) return;
      started = true;
      document.addEventListener('visibilitychange', onVisibilityChange);
      void refresh();
      if (!document.hidden) startTimer();
    },

    stop() {
      started = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopTimer();
    },
  };
}

export const libraryStore = createLibraryStore();
