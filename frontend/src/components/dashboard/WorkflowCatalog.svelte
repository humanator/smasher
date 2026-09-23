<script lang="ts">
  // ABOUTME: Workflow catalog page listing discovered workflows
  // ABOUTME: Fetches from GET /api/workflows, links to run submission

  import { onMount } from 'svelte';
  import * as workflowsApi from '../../lib/api/workflows';
  import * as runsApi from '../../lib/api/runs';

  interface Workflow {
    id: string;
    name: string;
    source_dir: string;
    path: string;
  }

  let workflows: Workflow[] = $state([]);
  let loading = $state(true);
  let error: string | null = $state(null);
  let runningWorkflowId: string | null = $state(null);
  let runError: string | null = $state(null);

  onMount(async () => {
    try {
      const response = await workflowsApi.listWorkflows();
      workflows = response.workflows;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load workflows';
    } finally {
      loading = false;
    }
  });

  // Launches a real run of the workflow's on-disk .dot file (server-side,
  // via POST /api/workflows/{id}/run) and navigates straight to the new
  // run's detail page -- no intermediate "confirm" page, matching the old
  // HTMX dashboard's single-click "run this workflow" behavior. Previously
  // this linked to `/runs/new?workflow={id}`, but nothing consumed that
  // query param and "new" collided with App.svelte's /runs/{id} route
  // regex (matched as a literal run id "new", 404ing every child fetch).
  async function handleRunWorkflow(workflowId: string) {
    runError = null;
    runningWorkflowId = workflowId;
    try {
      const response = await runsApi.runWorkflow(workflowId);
      window.location.href = `/runs/${response.run_id}`;
    } catch (err) {
      runError = err instanceof Error ? err.message : 'Failed to start run';
      runningWorkflowId = null;
    }
  }

  function formatWorkflowName(name: string): string {
    // Convert "consensus_task.dot" to "Consensus Task"
    return name
      .replace(/\.dot$/, '')
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
</script>

<div class="workflow-catalog">
  <div class="catalog-header">
    <h1>Workflows</h1>
  </div>

  {#if loading}
    <p class="loading">Loading workflows...</p>
  {:else if error}
    <p class="error" role="alert">Error: {error}</p>
  {:else if workflows.length === 0}
    <p class="empty-state">No workflows configured.</p>
  {:else}
    {#if runError}
      <p class="error" role="alert">{runError}</p>
    {/if}
    <div class="workflow-list">
      {#each workflows as workflow (workflow.id)}
        <div class="workflow-card">
          <h2>{formatWorkflowName(workflow.name)}</h2>
          <p class="workflow-path">{workflow.name}</p>
          <p class="workflow-source">From: {workflow.source_dir}</p>
          <div class="workflow-actions">
            <a href="/workflows/{workflow.id}/edit" class="btn btn-secondary btn-sm">
              Edit
            </a>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              disabled={runningWorkflowId === workflow.id}
              onclick={() => handleRunWorkflow(workflow.id)}
            >
              {runningWorkflowId === workflow.id ? 'Starting…' : 'Run Workflow'}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .workflow-catalog {
    padding: 2rem;
  }

  .catalog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2rem;
    margin: 0;
    color: #1e293b;
  }

  .loading,
  .error,
  .empty-state {
    font-size: 1.125rem;
    color: #64748b;
    text-align: center;
    padding: 2rem;
  }

  .error {
    color: #dc2626;
  }

  .workflow-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .workflow-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s;
    display: flex;
    flex-direction: column;
  }

  .workflow-card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .workflow-card h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: #1e293b;
  }

  .workflow-path {
    margin: 0.5rem 0;
    font-size: 0.875rem;
    color: #64748b;
    font-family: monospace;
  }

  .workflow-source {
    margin: 0.5rem 0 1.5rem 0;
    font-size: 0.875rem;
    color: #94a3b8;
  }

  .workflow-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: auto;
  }

  .btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    text-decoration: none;
    font-size: 0.875rem;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background-color: #2563eb;
  }

  .btn-secondary {
    background-color: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #4b5563;
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
</style>
