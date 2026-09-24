<script lang="ts">
  // ABOUTME: Presentational status pill for a run's lifecycle state
  // ABOUTME: Color-codes Running/Completed/Failed/Aborted per the backend's RunStatus values

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { cn } from '$lib/utils';

  let { status }: { status: string } = $props();

  // Status colors carry semantic meaning, so they stay as explicit hues
  // rather than theme tokens.
  const STATUS_CLASSES: Record<string, string> = {
    running: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    aborted: 'bg-muted text-muted-foreground',
    cancelled: 'bg-muted text-muted-foreground',
  };
</script>

<Badge
  variant="secondary"
  class={cn(
    'status status-' + status.toLowerCase(),
    'rounded font-semibold uppercase',
    STATUS_CLASSES[status.toLowerCase()]
  )}
>
  {status}
</Badge>
