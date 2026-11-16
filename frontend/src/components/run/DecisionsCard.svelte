<script lang="ts">
  // ABOUTME: The run page's "Your decisions": one card per recorded gallery-gate decision, with its selection and notes
  // ABOUTME: Presentational; renders nothing when there are no decisions. Step titles come from the labels RunPage passes

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { decisionLabel, isApproveDecision } from '$lib/decisionEdges';
  import { formatWhen } from '$lib/timeFormat';
  import type { DecisionResponse } from '../../lib/api/runs';

  let {
    decisions,
    labels,
  }: {
    decisions: readonly DecisionResponse[];
    /** Step names by node id; a decision at an unnamed step shows the id. */
    labels: ReadonlyMap<string, string>;
  } = $props();

  // Read once: a recorded time doesn't age.
  const now = new Date();
</script>

{#if decisions.length > 0}
  <section aria-labelledby="decisions-heading" class="flex flex-col gap-3">
    <h2 id="decisions-heading" class="text-heading m-0 font-semibold text-foreground">Your decisions</h2>
    <ul class="m-0 flex list-none flex-col gap-3 p-0">
      {#each decisions as decision (decision.node_id + decision.timestamp)}
        <li class="rounded-xl border border-border bg-card px-4 py-3">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 class="text-body m-0 font-semibold text-foreground">{labels.get(decision.node_id) ?? decision.node_id}</h3>
            <Badge variant={isApproveDecision(decision.decision) ? 'default' : 'secondary'}>
              {decisionLabel(decision.decision)}
            </Badge>
            <time datetime={decision.timestamp} class="text-small ml-auto text-muted-foreground"
              >{formatWhen(decision.timestamp, now)}</time
            >
          </div>
          <div class="mt-2 flex flex-wrap gap-1.5">
            {#each decision.selected as candidateId (candidateId)}
              <Badge variant="outline" dot="var(--success)" class="font-mono">{candidateId}</Badge>
            {:else}
              <span class="text-small text-muted-foreground">Nothing selected</span>
            {/each}
          </div>
          {#if Object.keys(decision.comments).length > 0}
            <dl class="mt-2 mb-0">
              {#each Object.entries(decision.comments) as [candidateId, comment] (candidateId)}
                <div class="text-small mb-1 text-muted-foreground">
                  <dt class="inline font-mono font-semibold after:content-[':_']">{candidateId}</dt>
                  <dd class="m-0 inline">{comment}</dd>
                </div>
              {/each}
            </dl>
          {/if}
        </li>
      {/each}
    </ul>
  </section>
{/if}
