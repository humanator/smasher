// ABOUTME: Svelte 5 rune-based store for current run status and metadata
// ABOUTME: Tracks status, tokens, timestamps; updated via API polls and SSE events

export interface RunState {
  id: string | null;
  status: 'Running' | 'Completed' | 'Failed' | 'Aborted' | null;
  startedAt: string | null;
  completedAt: string | null;
  graphName: string | null;
  error: string | null;
  inputTokens: number;
  outputTokens: number;
  runWorkingDir: string | null;
  workflowId: string | null;
}

function createRunStore() {
  let run = $state<RunState>({
    id: null,
    status: null,
    startedAt: null,
    completedAt: null,
    graphName: null,
    error: null,
    inputTokens: 0,
    outputTokens: 0,
    runWorkingDir: null,
    workflowId: null,
  });

  return {
    get state() {
      return run;
    },

    set(update: Partial<RunState>) {
      Object.assign(run, update);
    },

    setFromApi(apiRun: Record<string, unknown>) {
      run = {
        id: apiRun.id as string,
        status: apiRun.status as RunState['status'],
        startedAt: apiRun.started_at as string | null,
        completedAt: apiRun.completed_at as string | null,
        graphName: apiRun.graph_name as string | null,
        error: apiRun.error as string | null,
        inputTokens: (apiRun.input_tokens as number) || 0,
        outputTokens: (apiRun.output_tokens as number) || 0,
        runWorkingDir: apiRun.run_working_dir as string | null,
        workflowId: apiRun.workflow_id as string | null,
      };
    },

    reset() {
      run = {
        id: null,
        status: null,
        startedAt: null,
        completedAt: null,
        graphName: null,
        error: null,
        inputTokens: 0,
        outputTokens: 0,
        runWorkingDir: null,
        workflowId: null,
      };
    },
  };
}

export const runStore = createRunStore();
