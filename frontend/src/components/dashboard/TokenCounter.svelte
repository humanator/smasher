<script lang="ts">
  // ABOUTME: Polls GET /api/runs/{id}/tokens and shows live input, output and total token counts
  // ABOUTME: Refreshes every 3s while the run is active, as the old dashboard did, then once more

  import * as runsApi from '../../lib/api/runs';

  let { runId, active = true }: { runId: string; active?: boolean } = $props();

  const POLL_INTERVAL_MS = 3000;

  let inputTokens = $state(0);
  let outputTokens = $state(0);
  let error: string | null = $state(null);

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

  // Fetch now; keep polling only while active. Turning inactive clears the
  // interval and re-runs this once, which is the final fetch.
  $effect(() => {
    refresh();
    if (!active) return;
    const pollHandle = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(pollHandle);
  });
</script>

<div class="token-counter flex gap-6 text-sm text-muted-foreground">
  {#if error}
    <span class="text-destructive" role="alert">Error: {error}</span>
  {:else}
    <span class="token">Input tokens: {inputTokens.toLocaleString()}</span>
    <span class="token">Output tokens: {outputTokens.toLocaleString()}</span>
    <span class="token">Total tokens: {(inputTokens + outputTokens).toLocaleString()}</span>
  {/if}
</div>
