<script lang="ts">
  // ABOUTME: Gallery-gate decision UI - candidate checkboxes, per-candidate comments,
  // ABOUTME: and outgoing-edge decision buttons. Mirrors gallery_gate.html.

  import { onMount, onDestroy } from 'svelte';
  import * as questionsApi from '../../lib/api/questions';
  import * as galleryApi from '../../lib/api/gallery';
  import type { GalleryGateInfo } from '../../lib/api/questions';
  import ScorecardBadges, { type Scorecard } from './ScorecardBadges.svelte';
  import CandidatePreview from './CandidatePreview.svelte';
  import CandidateParams from './CandidateParams.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { pollFailureNotifier } from '$lib/notify';

  let { runId }: { runId: string } = $props();

  const POLL_INTERVAL_MS = 2000;

  let gate: GalleryGateInfo | null = $state(null);
  let selected: Record<string, boolean> = $state({});
  let comments: Record<string, string> = $state({});
  let submitting = $state(false);
  let done = $state(false);
  let error: string | null = $state(null);
  let pollHandle: ReturnType<typeof setInterval> | undefined;
  let pollFailure: ReturnType<typeof pollFailureNotifier> | undefined;

  interface ExitStatus {
    status: 'success' | 'failed';
    reason?: string;
  }

  async function refresh() {
    try {
      const response = await questionsApi.listQuestions(runId);
      // Once a decision is submitted the gate resolves and disappears from
      // the poll response; keep showing the "done" state rather than
      // reverting to nothing.
      if (!done) {
        gate = response.gallery_gate;
      }
      pollFailure?.ok();
    } catch (err) {
      // The next poll retries; a run of failures toasts once, not every tick.
      pollFailure?.fail(err);
    }
  }

  function isFailed(candidate: GalleryGateInfo['candidates'][number]): boolean {
    const exitStatus = candidate.manifest?.exit_status as ExitStatus | undefined;
    return exitStatus?.status === 'failed';
  }

  function failureReason(candidate: GalleryGateInfo['candidates'][number]): string | undefined {
    const exitStatus = candidate.manifest?.exit_status as ExitStatus | undefined;
    return exitStatus?.reason;
  }

  async function handleDecision(edge: string) {
    if (!gate || submitting) return;
    submitting = true;
    error = null;

    const selectedIds = Object.entries(selected)
      .filter(([, checked]) => checked)
      .map(([id]) => id);
    const trimmedComments: Record<string, string> = {};
    for (const [id, text] of Object.entries(comments)) {
      const trimmed = text.trim();
      if (trimmed) trimmedComments[id] = trimmed;
    }

    try {
      const resp = await galleryApi.submitGalleryDecision(runId, gate.question_id, {
        selected: selectedIds,
        decision: edge,
        comments: trimmedComments,
      });
      if (resp.success) {
        done = true;
        gate = null;
      } else {
        error = resp.error ?? 'decision not accepted';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to submit decision';
    } finally {
      submitting = false;
    }
  }

  onMount(() => {
    pollFailure = pollFailureNotifier(
      `gallery-gate-poll:${runId}`,
      'Failed to load the gallery gate'
    );
    refresh();
    pollHandle = setInterval(refresh, POLL_INTERVAL_MS);
  });

  onDestroy(() => {
    if (pollHandle) clearInterval(pollHandle);
  });
</script>

{#if done}
  <p class="gate-done font-medium text-green-700">Decision recorded — resuming…</p>
{:else if gate}
  <div class="gate-card flex flex-col gap-4">
    {#if gate.expected_count !== null}
      <p class="m-0 text-sm text-muted-foreground">
        Expected {gate.expected_count}, found {gate.candidates.length}
      </p>
    {:else}
      <p class="m-0 text-sm text-muted-foreground">Found {gate.candidates.length} candidate(s)</p>
    {/if}

    <div class="candidate-grid grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
      {#each gate.candidates as candidate (candidate.candidate_id)}
        {#if isFailed(candidate)}
          <Card.Root
            size="sm"
            class="candidate-card candidate-card-failed gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 shadow-none ring-0"
          >
            <div class="candidate-id font-mono text-xs text-foreground">{candidate.candidate_id}</div>
            {#if failureReason(candidate)}
              <p class="text-sm text-destructive">{failureReason(candidate)}</p>
            {/if}
          </Card.Root>
        {:else}
          <!-- Native label kept as the card container: the whole card toggles the checkbox. -->
          <label
            class="candidate-card flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-card p-4 text-card-foreground"
          >
            <Checkbox
              checked={selected[candidate.candidate_id] ?? false}
              onCheckedChange={(checked) => (selected[candidate.candidate_id] = checked)}
              aria-label={candidate.candidate_id}
            />
            <!-- The thumbnail <button> and params <summary> take their own clicks, so the label doesn't toggle. -->
            <CandidatePreview {candidate} />
            <span class="candidate-id font-mono text-xs text-foreground">{candidate.candidate_id}</span>
            <CandidateParams
              params={candidate.manifest?.generation_params as Record<string, string> | undefined}
            />
            <ScorecardBadges scorecard={(candidate.scorecard ?? {}) as Scorecard} />
            <Textarea
              class="candidate-comment min-h-12 resize-y rounded-md px-2 py-2 text-xs md:text-xs"
              aria-label="Comment for {candidate.candidate_id}"
              placeholder="Notes to drive the next iteration (optional)"
              value={comments[candidate.candidate_id] ?? ''}
              oninput={(e) =>
                (comments[candidate.candidate_id] = (e.target as HTMLTextAreaElement).value)}
            />
          </label>
        {/if}
      {/each}
    </div>

    <div class="gate-decision-bar flex gap-2">
      {#each gate.outgoing_edges as edge (edge)}
        <Button disabled={submitting} onclick={() => handleDecision(edge)}>
          {edge}
        </Button>
      {/each}
    </div>
    <p class="m-0 text-xs text-muted-foreground">
      No boxes checked + an iterate edge = reject-all and re-roll.
    </p>
    {#if error}
      <p class="gate-error text-sm text-destructive" role="alert">{error}</p>
    {/if}
  </div>
{/if}
