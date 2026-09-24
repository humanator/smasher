<script lang="ts">
  // ABOUTME: Polls GET /api/runs/{id}/tokens and shows live input/output token counts
  // ABOUTME: Polling cadence matches the old dashboard's 5s refresh

  import { onMount, onDestroy } from 'svelte';
  import * as runsApi from '../../lib/api/runs';

  let { runId }: { runId: string } = $props();

  const POLL_INTERVAL_MS = 5000;

  let inputTokens = $state(0);
  let outputTokens = $state(0);
  let error: string | null = $state(null);
  let pollHandle: ReturnType<typeof setInterval> | undefined;

  async function refresh() {
    try {
      const tokens = await runsApi.getTokens(runId);
      inputTokens = tokens.input_tokens;
      outputTokens = tokens.output_tokens;
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load tokens';
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

<div class="token-counter flex gap-6 text-sm text-muted-foreground">
  {#if error}
    <span class="text-destructive" role="alert">Error: {error}</span>
  {:else}
    <span class="token">Input tokens: {inputTokens}</span>
    <span class="token">Output tokens: {outputTokens}</span>
  {/if}
</div>
