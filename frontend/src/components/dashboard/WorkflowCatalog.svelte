<script lang="ts">
  // ABOUTME: Workflow catalog page listing discovered workflows
  // ABOUTME: Fetches from GET /api/workflows, links to run submission, imports .dot files

  import { onMount } from 'svelte';
  import * as workflowsApi from '../../lib/api/workflows';
  import * as runsApi from '../../lib/api/runs';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { formatWorkflowName } from '$lib/utils';
  import { loadFile } from '../../lib/native';

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
  let importError: string | null = $state(null);

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

  // Native open dialog in the desktop app, file input in the browser. The
  // workflow is named after the file's stem, then opened in the editor.
  async function handleImport() {
    importError = null;
    try {
      const file = await loadFile();
      if (!file) return;
      const name = file instanceof File ? file.name.replace(/\.(dot|gv)$/i, '') : 'imported';
      const { id } = await workflowsApi.importWorkflowDot(name, await file.text());
      window.location.href = `/workflows/${id}/edit`;
    } catch (err) {
      importError = err instanceof Error ? err.message : 'Failed to import workflow';
    }
  }
</script>

<div class="workflow-catalog p-8">
  <div class="mb-4 flex items-center justify-between">
    <h2 class="text-xl font-semibold text-foreground">Workflows</h2>
    <Button variant="secondary" size="sm" onclick={handleImport} data-testid="import-dot-button">
      Import .dot
    </Button>
  </div>

  {#if importError}
    <p class="p-8 text-center text-lg text-destructive" role="alert">{importError}</p>
  {/if}

  {#if loading}
    <p class="p-8 text-center text-lg text-muted-foreground">Loading workflows...</p>
  {:else if error}
    <p class="p-8 text-center text-lg text-destructive" role="alert">Error: {error}</p>
  {:else if workflows.length === 0}
    <p class="p-8 text-center text-lg text-muted-foreground">No workflows configured.</p>
  {:else}
    {#if runError}
      <p class="p-8 text-center text-lg text-destructive" role="alert">{runError}</p>
    {/if}
    <div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <Table.Root>
        <Table.Header class="bg-muted/50">
          <Table.Row>
            <Table.Head class="text-muted-foreground">Name</Table.Head>
            <Table.Head class="text-muted-foreground">Source</Table.Head>
            <Table.Head class="text-muted-foreground">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each workflows as workflow (workflow.id)}
            <Table.Row>
              <Table.Cell>
                <div class="font-semibold text-foreground">{formatWorkflowName(workflow.name)}</div>
                <div class="mt-0.5 font-mono text-xs text-muted-foreground">{workflow.name}</div>
              </Table.Cell>
              <Table.Cell>{workflow.source_dir}</Table.Cell>
              <Table.Cell>
                <div class="flex gap-2">
                  <Button href="/workflows/{workflow.id}/edit" variant="secondary" size="sm">
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    disabled={runningWorkflowId === workflow.id}
                    onclick={() => handleRunWorkflow(workflow.id)}
                  >
                    {runningWorkflowId === workflow.id ? 'Starting…' : 'Run Workflow'}
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}
</div>
