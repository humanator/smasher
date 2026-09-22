// ABOUTME: Tests for run store with real API data
// ABOUTME: Verifies state management of run status and metadata

import { describe, it, expect, beforeEach } from 'vitest';
import { runStore } from '../../src/stores/run.svelte';

describe('run store', () => {
  beforeEach(() => {
    runStore.reset();
  });

  it('starts with null state', () => {
    expect(runStore.state.id).toBeNull();
    expect(runStore.state.status).toBeNull();
  });

  it('updates run from API response', () => {
    const apiRun = {
      id: 'run-123',
      status: 'Running',
      started_at: '2026-09-22T10:00:00Z',
      completed_at: null,
      graph_name: 'test_pipeline',
      error: null,
      input_tokens: 100,
      output_tokens: 50,
      run_working_dir: 'artifacts/run-123',
      workflow_id: null,
    };

    runStore.setFromApi(apiRun);

    expect(runStore.state.id).toBe('run-123');
    expect(runStore.state.status).toBe('Running');
    expect(runStore.state.graphName).toBe('test_pipeline');
    expect(runStore.state.inputTokens).toBe(100);
    expect(runStore.state.outputTokens).toBe(50);
  });

  it('updates partial state via set', () => {
    runStore.set({ id: 'run-456', status: 'Completed' });
    expect(runStore.state.id).toBe('run-456');
    expect(runStore.state.status).toBe('Completed');
  });

  it('resets to null state', () => {
    runStore.setFromApi({
      id: 'run-789',
      status: 'Running',
      started_at: '2026-09-22T10:00:00Z',
      completed_at: null,
      graph_name: 'pipeline',
      error: null,
      input_tokens: 0,
      output_tokens: 0,
      run_working_dir: 'artifacts/run-789',
      workflow_id: null,
    });

    runStore.reset();

    expect(runStore.state.id).toBeNull();
    expect(runStore.state.status).toBeNull();
    expect(runStore.state.graphName).toBeNull();
  });

  it('tracks token counts', () => {
    runStore.set({ inputTokens: 5000, outputTokens: 12000 });
    expect(runStore.state.inputTokens).toBe(5000);
    expect(runStore.state.outputTokens).toBe(12000);
  });

  it('handles error state', () => {
    runStore.set({
      status: 'Failed',
      error: 'Node X execution failed',
      completedAt: '2026-09-22T10:05:00Z',
    });
    expect(runStore.state.status).toBe('Failed');
    expect(runStore.state.error).toBe('Node X execution failed');
  });
});
