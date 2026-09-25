<script lang="ts">
  // ABOUTME: A run's Completed / Working Directory / Error rows, each shown only when set
  // ABOUTME: Mounted by the run page and the workflow page's run card

  import type { RunSummary } from '../../lib/api/runs';

  let { run }: { run: RunSummary } = $props();
</script>

{#if run.completed_at || run.run_working_dir || run.error}
  <dl class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
    {#if run.completed_at}
      <dt class="text-muted-foreground">Completed</dt>
      <dd>{new Date(run.completed_at).toLocaleString()}</dd>
    {/if}
    {#if run.run_working_dir}
      <dt class="text-muted-foreground">Working Directory</dt>
      <dd class="font-mono break-all">{run.run_working_dir}</dd>
    {/if}
    {#if run.error}
      <dt class="text-muted-foreground">Error</dt>
      <dd class="text-destructive break-words whitespace-pre-wrap">{run.error}</dd>
    {/if}
  </dl>
{/if}
