<script lang="ts">
  // ABOUTME: Polled list of past gallery-gate decisions for a run
  // ABOUTME: Mirrors decision_history.html

  import { onMount, onDestroy } from 'svelte';
  import * as runsApi from '../../lib/api/runs';
  import type { DecisionResponse } from '../../lib/api/runs';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Card from '$lib/components/ui/card/index.js';

  let { runId }: { runId: string } = $props();

  const POLL_INTERVAL_MS = 5000;

  let decisions: DecisionResponse[] = $state([]);
  let loading = $state(true);
  let error: string | null = $state(null);
  let pollHandle: ReturnType<typeof setInterval> | undefined;

  async function refresh() {
    try {
      const response = await runsApi.listDecisions(runId);
      decisions = response.decisions;
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load decision history';
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

<div class="decision-history">
  {#if loading}
    <p class="p-6 text-center text-muted-foreground">Loading decision history...</p>
  {:else if error}
    <p class="p-6 text-center text-destructive" role="alert">Error: {error}</p>
  {:else if decisions.length === 0}
    <p class="p-6 text-center text-muted-foreground">No decisions yet.</p>
  {:else}
    <ul class="decision-list m-0 flex list-none flex-col gap-3 p-0">
      {#each decisions as decision (decision.node_id + decision.timestamp)}
        <li class="decision-item">
          <Card.Root size="sm" class="block rounded-lg border border-border p-4 shadow-none ring-0">
            <div class="flex flex-wrap items-center gap-3">
              <span class="font-mono text-xs font-semibold text-foreground">{decision.node_id}</span>
              <Badge variant="secondary" class="rounded font-semibold">{decision.decision}</Badge>
              <span class="ml-auto text-xs text-muted-foreground"
                >{new Date(decision.timestamp).toLocaleString()}</span
              >
            </div>
            {#if decision.selected.length > 0}
              <div class="mt-2 flex flex-wrap gap-1.5">
                <!-- Selected candidates are green: selection carries semantic meaning. -->
                {#each decision.selected as candidateId (candidateId)}
                  <Badge class="rounded bg-green-100 font-mono font-normal text-green-700"
                    >{candidateId}</Badge
                  >
                {/each}
              </div>
            {/if}
            {#if Object.keys(decision.comments).length > 0}
              <dl class="mt-2">
                {#each Object.entries(decision.comments) as [candidateId, comment] (candidateId)}
                  <div class="mb-1 text-xs text-muted-foreground">
                    <dt class="inline font-mono font-semibold after:content-[':_']">{candidateId}</dt>
                    <dd class="m-0 inline">{comment}</dd>
                  </div>
                {/each}
              </dl>
            {/if}
          </Card.Root>
        </li>
      {/each}
    </ul>
  {/if}
</div>
