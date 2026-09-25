<script lang="ts">
  // ABOUTME: The runs table: run id linking to /runs/{id}, workflow name, status and start time
  // ABOUTME: Shared by the run list and the workflow detail page's run history

  import type { RunSummary } from '../../lib/api/runs';
  import * as Table from '$lib/components/ui/table/index.js';
  import StatusBadge from './StatusBadge.svelte';

  let { runs }: { runs: RunSummary[] } = $props();
</script>

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
          <Table.Cell>
            {#if run.graph_name?.trim()}
              {run.graph_name}
            {:else}
              <span class="text-muted-foreground">unnamed</span>
            {/if}
          </Table.Cell>
          <Table.Cell><StatusBadge status={run.status} /></Table.Cell>
          <Table.Cell>{new Date(run.started_at).toLocaleString()}</Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
