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

    setFromApi(apiRun: any) {
      run = {
        id: apiRun.id,
        status: apiRun.status,
        startedAt: apiRun.started_at,
        completedAt: apiRun.completed_at,
        graphName: apiRun.graph_name,
        error: apiRun.error,
        inputTokens: apiRun.input_tokens,
        outputTokens: apiRun.output_tokens,
        runWorkingDir: apiRun.run_working_dir,
        workflowId: apiRun.workflow_id,
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
