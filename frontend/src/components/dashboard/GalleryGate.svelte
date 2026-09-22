<script lang="ts">
  // ABOUTME: Gallery-gate decision UI - candidate checkboxes, per-candidate comments,
  // ABOUTME: and outgoing-edge decision buttons. Mirrors gallery_gate.html.

  import { onMount, onDestroy } from 'svelte';
  import * as questionsApi from '../../lib/api/questions';
  import * as galleryApi from '../../lib/api/gallery';
  import type { GalleryGateInfo } from '../../lib/api/questions';
  import ScorecardBadges, { type Scorecard } from './ScorecardBadges.svelte';

  let { runId }: { runId: string } = $props();

  const POLL_INTERVAL_MS = 2000;

  let gate: GalleryGateInfo | null = $state(null);
  let selected: Record<string, boolean> = $state({});
  let comments: Record<string, string> = $state({});
  let submitting = $state(false);
  let done = $state(false);
  let error: string | null = $state(null);
  let pollHandle: ReturnType<typeof setInterval> | undefined;

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
    } catch {
      // Transient poll failures aren't surfaced here - the next poll retries.
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
    refresh();
    pollHandle = setInterval(refresh, POLL_INTERVAL_MS);
  });

  onDestroy(() => {
    if (pollHandle) clearInterval(pollHandle);
  });
</script>

{#if done}
  <p class="gate-done">Decision recorded — resuming…</p>
{:else if gate}
  <div class="gate-card">
    {#if gate.expected_count !== null}
      <p class="gate-hint">Expected {gate.expected_count}, found {gate.candidates.length}</p>
    {:else}
      <p class="gate-hint">Found {gate.candidates.length} candidate(s)</p>
    {/if}

    <div class="candidate-grid">
      {#each gate.candidates as candidate (candidate.candidate_id)}
        {#if isFailed(candidate)}
          <div class="candidate-card candidate-card-failed">
            <div class="candidate-id">{candidate.candidate_id}</div>
            {#if failureReason(candidate)}
              <p class="candidate-failure-reason">{failureReason(candidate)}</p>
            {/if}
          </div>
        {:else}
          <label class="candidate-card">
            <input
              type="checkbox"
              checked={selected[candidate.candidate_id] ?? false}
              onchange={(e) =>
                (selected[candidate.candidate_id] = (e.target as HTMLInputElement).checked)}
              aria-label={candidate.candidate_id}
            />
            <div class="candidate-embed">
              {#if candidate.bundle_url}
                <iframe
                  src={candidate.bundle_url}
                  title="Candidate {candidate.candidate_id}"
                  sandbox="allow-scripts"
                  class="candidate-thumbnail"
                ></iframe>
              {:else}
                <img
                  src={candidate.screenshot_url}
                  alt="Candidate {candidate.candidate_id}"
                  class="candidate-thumbnail"
                />
              {/if}
            </div>
            <span class="candidate-id">{candidate.candidate_id}</span>
            <ScorecardBadges scorecard={(candidate.scorecard ?? {}) as Scorecard} />
            <textarea
              class="candidate-comment"
              aria-label="Comment for {candidate.candidate_id}"
              placeholder="Notes to drive the next iteration (optional)"
              value={comments[candidate.candidate_id] ?? ''}
              oninput={(e) =>
                (comments[candidate.candidate_id] = (e.target as HTMLTextAreaElement).value)}
            ></textarea>
          </label>
        {/if}
      {/each}
    </div>

    <div class="gate-decision-bar">
      {#each gate.outgoing_edges as edge (edge)}
        <button
          type="button"
          class="btn btn-primary"
          disabled={submitting}
          onclick={() => handleDecision(edge)}
        >
          {edge}
        </button>
      {/each}
    </div>
    <p class="gate-note">No boxes checked + an iterate edge = reject-all and re-roll.</p>
    {#if error}
      <p class="gate-error" role="alert">{error}</p>
    {/if}
  </div>
{/if}

<style>
  .gate-done {
    color: #15803d;
    font-weight: 500;
  }

  .gate-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .gate-hint {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
  }

  .candidate-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.25rem;
  }

  .candidate-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    cursor: pointer;
  }

  .candidate-card-failed {
    background: #fef2f2;
    border-color: #fecaca;
    cursor: default;
  }

  .candidate-embed {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 4px;
    background: #f1f5f9;
  }

  .candidate-thumbnail {
    width: 100%;
    height: 100%;
    border: none;
    object-fit: cover;
  }

  .candidate-id {
    font-family: monospace;
    font-size: 0.8125rem;
    color: #1e293b;
  }

  .candidate-failure-reason {
    color: #b91c1c;
    font-size: 0.875rem;
  }

  .candidate-comment {
    width: 100%;
    min-height: 3rem;
    padding: 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 0.8125rem;
    resize: vertical;
  }

  .gate-decision-bar {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1.25rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .btn-primary:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
  }

  .gate-note {
    color: #94a3b8;
    font-size: 0.75rem;
    margin: 0;
  }

  .gate-error {
    color: #dc2626;
    font-size: 0.875rem;
  }
</style>
