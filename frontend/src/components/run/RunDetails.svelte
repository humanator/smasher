<script lang="ts">
  // ABOUTME: The run panel's Details tab: when the run started and how long it took, token counts, and the working folder
  // ABOUTME: Token counts poll every 3s while the run is active, then are fetched once more when it ends

  import * as runsApi from '../../lib/api/runs';
  import type { RunSummary } from '../../lib/api/runs';
  import { errorMessage } from '$lib/notify';
  import { formatDuration, formatWhen } from '$lib/timeFormat';

  let {
    run,
    active,
    now,
  }: {
    run: RunSummary;
    active: boolean;
    /** Ticks while the run is going, so "so far" ages. */
    now: Date;
  } = $props();

  const POLL_INTERVAL_MS = 3000;

  let inputTokens = $state(0);
  let outputTokens = $state(0);
  let tokenError = $state<string | null>(null);

  const runId = $derived(run.id);

  async function refresh(id: string) {
    try {
      const tokens = await runsApi.getTokens(id);
      inputTokens = tokens.input_tokens;
      outputTokens = tokens.output_tokens;
      tokenError = null;
    } catch (err) {
      tokenError = errorMessage(err, 'Something went wrong.');
    }
  }

  // Fetch now; keep polling only while active. Turning inactive clears the
  // interval and re-runs this once, which is the final fetch.
  $effect(() => {
    const id = runId;
    void refresh(id);
    if (!active) return;
    const pollHandle = setInterval(() => void refresh(id), POLL_INTERVAL_MS);
    return () => clearInterval(pollHandle);
  });

  const started = $derived(
    `${formatWhen(run.started_at, now)} · ${formatDuration(run.started_at, run.completed_at, now)}`
  );
  const total = $derived(inputTokens + outputTokens);
</script>

{#snippet item(label: string, hint: string | null, value: string, mono = false)}
  <div class="flex flex-col gap-0.5">
    <dt class="text-xs font-medium text-muted-foreground">{label}</dt>
    <dd class="m-0 flex flex-col gap-0.5">
      <span class={['text-body text-foreground', mono && 'font-mono text-xs break-all']}>{value}</span>
      {#if hint}<span class="text-xs text-muted-foreground">{hint}</span>{/if}
    </dd>
  </div>
{/snippet}

<dl class="m-0 flex flex-col gap-3.5">
  {@render item('Started', null, started)}
  {#if tokenError}
    <div role="alert" class="text-body text-destructive">Couldn't load the token counts. {tokenError}</div>
  {:else}
    {@render item('Input tokens', 'Text sent to the AI', inputTokens.toLocaleString())}
    {@render item('Output tokens', 'Text the AI wrote back', outputTokens.toLocaleString())}
    {@render item('Total tokens', null, total.toLocaleString())}
  {/if}
  {#if run.run_working_dir}
    {@render item('Working folder', 'Where this run saves its files', run.run_working_dir, true)}
  {/if}
</dl>
