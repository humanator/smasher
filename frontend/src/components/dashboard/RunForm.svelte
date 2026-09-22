<script lang="ts">
  // ABOUTME: Run submission form - submits DOT source to POST /api/runs
  // ABOUTME: Critical for Phase 3 E2E critical path

  import { runStore } from '../../stores/run.svelte';
  import { eventStore } from '../../stores/events.svelte';
  import * as runsApi from '../../lib/api/runs';

  let dotSource = $state('');
  let submitting = $state(false);
  let error: string | null = $state(null);

  async function handleSubmit() {
    if (!dotSource.trim()) {
      error = 'Please enter workflow DOT source';
      return;
    }

    submitting = true;
    error = null;

    try {
      const response = await runsApi.submitRun({
        dot_source: dotSource,
        variables: {},
      });

      // Update stores
      runStore.set({
        id: response.run_id,
        status: 'Running',
        startedAt: new Date().toISOString(),
      });

      eventStore.clear();

      // Optionally navigate to run detail (would be handled by router)
      window.location.href = `/runs/${response.run_id}`;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to submit run';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="run-form">
  <h2>Submit Pipeline</h2>

  <form onsubmit|preventDefault={handleSubmit}>
    <div class="form-group">
      <label for="dot-source">DOT Source:</label>
      <textarea
        id="dot-source"
        bind:value={dotSource}
        disabled={submitting}
        rows={10}
        placeholder="digraph { ... }"
      ></textarea>
    </div>

    {#if error}
      <p class="error" role="alert">{error}</p>
    {/if}

    <button type="submit" disabled={submitting} class="btn btn-primary">
      {submitting ? 'Submitting...' : 'Submit'}
    </button>
  </form>
</div>

<style>
  .run-form {
    padding: 2rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  h2 {
    margin-top: 0;
    color: #1e293b;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #475569;
  }

  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.875rem;
  }

  textarea:disabled {
    background-color: #f1f5f9;
    cursor: not-allowed;
  }

  .error {
    color: #dc2626;
    margin-bottom: 1rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .btn-primary:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
  }
</style>
