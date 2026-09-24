<script lang="ts">
  // ABOUTME: Run list page - polls GET /api/runs and shows real run status
  // ABOUTME: Links each row to its run detail page at /runs/{id}

  import { onMount, onDestroy } from 'svelte';
  import * as runsApi from '../../lib/api/runs';
  import type { RunSummary } from '../../lib/api/runs';
  import * as Table from '$lib/components/ui/table/index.js';
  import StatusBadge from './StatusBadge.svelte';

  const POLL_INTERVAL_MS = 5000;

  let runs: RunSummary[] = $state([]);
  let loading = $state(true);
  let error: string | null = $state(null);
  let pollHandle: ReturnType<typeof setInterval> | undefined;

  async function refresh() {
    try {
      const response = await runsApi.listRuns();
      runs = response.runs;
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load runs';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    refresh();
    pollHandle = setInterval(refresh, POLL_INTERVAL_MS);
  });

  onDestroy(() => {
    if (pollHandle) clearInterval(pollHandle);
  });
</script>

<div class="run-list p-8">
  <h2 class="mb-4 text-xl font-semibold text-foreground">Runs</h2>

  {#if loading}
    <p class="p-8 text-center text-lg text-muted-foreground">Loading runs...</p>
  {:else if error}
    <p class="p-8 text-center text-lg text-destructive" role="alert">Error: {error}</p>
  {:else if runs.length === 0}
    <p class="p-8 text-center text-lg text-muted-foreground">No runs yet.</p>
  {:else}
    <div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <Table.Root>
        <Table.Header class="bg-muted/50">
          <Table.Row>
            <Table.Head class="text-muted-foreground">Run</Table.Head>
            <Table.Head class="text-muted-foreground">Workflow</Table.Head>
            <Table.Head class="text-muted-foreground">Status</Table.Head>
            <Table.Head class="text-muted-foreground">Started</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each runs as run (run.id)}
            <Table.Row>
              <Table.Cell>
                <a href="/runs/{run.id}" class="font-mono text-primary hover:underline">{run.id}</a>
              </Table.Cell>
              <Table.Cell>{run.graph_name}</Table.Cell>
              <Table.Cell><StatusBadge status={run.status} /></Table.Cell>
              <Table.Cell>{new Date(run.started_at).toLocaleString()}</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}
</div>
