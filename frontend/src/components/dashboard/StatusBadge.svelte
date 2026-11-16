<script lang="ts">
  // ABOUTME: Status pill for a run or workflow: Running, Completed, Failed, Aborted, Needs you, No runs yet
  // ABOUTME: Renders the shared statusBadge mapping; the status is always text, the dot is decorative

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { statusBadge } from '$lib/runStatus';

  let { status }: { status: string } = $props();

  const badge = $derived(statusBadge(status));
</script>

<Badge variant={badge.variant} dot={badge.dot} class="status">{badge.label}</Badge>
