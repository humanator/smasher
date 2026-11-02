<script lang="ts">
  // ABOUTME: The run page's Candidates section: a grid of the gallery's candidates with a Select toggle, notes and scorecard badges
  // ABOUTME: Presentational; RunPage owns the selection and notes and passes them in, with the handlers

  import CheckIcon from '@lucide/svelte/icons/check';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import type { CandidateResponse } from '../../lib/api/runs';
  import CandidatePreview from '../dashboard/CandidatePreview.svelte';
  import ScorecardBadges, { type Scorecard } from '../dashboard/ScorecardBadges.svelte';

  let {
    candidates,
    expected = null,
    selectable = false,
    selected = [],
    chosen = [],
    notes = {},
    onToggle = () => {},
    onNote = () => {},
  }: {
    candidates: readonly CandidateResponse[];
    /** How many the gate expected, while it is waiting. */
    expected?: number | null;
    /** The gate is waiting: Select and notes are offered. */
    selectable?: boolean;
    selected?: readonly string[];
    /** Candidates approved by a decision. */
    chosen?: readonly string[];
    notes?: Readonly<Record<string, string>>;
    onToggle?: (candidateId: string) => void;
    onNote?: (candidateId: string, note: string) => void;
  } = $props();

  interface ExitStatus {
    status: 'success' | 'failed';
    reason?: string;
  }

  // Which candidates have their note editor open.
  let editing = $state<Record<string, boolean>>({});

  const exitStatus = (candidate: CandidateResponse) => candidate.manifest?.exit_status as ExitStatus | undefined;
  const isFailed = (candidate: CandidateResponse) => exitStatus(candidate)?.status === 'failed';
  const failedCount = $derived(candidates.filter(isFailed).length);
  const meta = $derived(
    `${expected === null ? 'Found' : `Expected ${expected}, found`} ${candidates.length}` +
      (failedCount > 0 ? ` · ${failedCount} could not be rendered` : '')
  );
</script>

<section aria-labelledby="candidates-heading" class="flex flex-col gap-3">
  <div class="flex flex-wrap items-baseline gap-x-3">
    <h2 id="candidates-heading" class="text-heading m-0 font-semibold text-foreground">Candidates</h2>
    <p class="text-small m-0 text-muted-foreground">{meta}</p>
  </div>

  <div data-testid="candidate-grid" class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
    {#each candidates as candidate (candidate.candidate_id)}
      {@const id = candidate.candidate_id}
      {#if isFailed(candidate)}
        <div
          class="candidate-card flex flex-col gap-2.5 rounded-xl border border-destructive-border bg-destructive-surface p-3"
        >
          <div
            class="flex h-32 items-center justify-center rounded-md border border-dashed border-destructive-border bg-background"
          >
            <TriangleAlertIcon class="size-6 text-destructive" aria-hidden="true" />
          </div>
          <div class="font-mono text-small font-semibold text-foreground">{id}</div>
          {#if exitStatus(candidate)?.reason}
            <p class="text-small m-0 text-destructive">{exitStatus(candidate)?.reason}</p>
          {/if}
        </div>
      {:else}
        {@const isSelected = selected.includes(id)}
        {@const isChosen = chosen.includes(id)}
        <div
          class="candidate-card flex flex-col gap-2.5 rounded-xl bg-card p-3 text-card-foreground {isChosen
            ? 'shadow-card ring-2 ring-success'
            : isSelected
              ? 'shadow-card ring-2 ring-primary'
              : 'shadow-card'}"
        >
          <CandidatePreview {candidate} />
          <div class="flex items-center gap-2">
            <span class="min-w-0 flex-1 truncate font-mono text-small font-semibold text-foreground">{id}</span>
            {#if isChosen}
              <Badge variant="secondary" dot="var(--success)">Chosen</Badge>
            {/if}
            {#if selectable}
              <Button
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                aria-pressed={isSelected}
                onclick={() => onToggle(id)}
              >
                {#if isSelected}<CheckIcon aria-hidden="true" />{/if}
                {isSelected ? 'Selected' : 'Select'}<span class="sr-only"> {id}</span>
              </Button>
            {/if}
          </div>
          <ScorecardBadges scorecard={(candidate.scorecard ?? {}) as Scorecard} />
          {#if selectable}
            <Button
              variant="link"
              size="xs"
              class="self-start dark:text-primary-subtle-foreground"
              aria-expanded={!!editing[id]}
              onclick={() => (editing[id] = !editing[id])}
            >
              {editing[id] ? 'Hide Note' : notes[id] ? 'Edit Note' : 'Add a Note…'}
            </Button>
          {/if}
          {#if editing[id]}
            <Textarea
              aria-label="Note for {id}"
              rows={2}
              placeholder="Notes to steer the next round (optional)"
              value={notes[id] ?? ''}
              oninput={(e) => onNote(id, (e.target as HTMLTextAreaElement).value)}
            />
          {:else if notes[id]}
            <p class="text-small m-0 break-words text-muted-foreground">Your note: {notes[id]}</p>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
</section>
