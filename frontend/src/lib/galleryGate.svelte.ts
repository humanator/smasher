// ABOUTME: Follows a run's gallery gate: the question, its candidates, what a person has selected and noted, and the decision
// ABOUTME: Polls while started; once a decision is taken the answered gate stays gone, and a new one starts from a clean slate

import * as galleryApi from './api/gallery';
import * as questionsApi from './api/questions';
import * as runsApi from './api/runs';
import type { GalleryGateInfo } from './api/questions';
import type { CandidateResponse } from './api/runs';
import { pollFailureNotifier } from './notify';

export interface GalleryGateOptions {
  /** Called once a decision has been accepted. */
  onDecided?: () => void;
  pollMs?: number;
}

export class GalleryGateState {
  /** The gate waiting for a decision, or null. */
  gate = $state<GalleryGateInfo | null>(null);
  /** Candidates listed from disk, for when no gate is waiting (answered, or the run is over). */
  listed = $state<CandidateResponse[]>([]);
  selected = $state<string[]>([]);
  notes = $state<Record<string, string>>({});
  submitting = $state(false);
  error = $state<string | null>(null);

  readonly #runId: string;
  readonly #onDecided: () => void;
  readonly #pollMs: number;
  readonly #pollFailure: ReturnType<typeof pollFailureNotifier>;
  #timer: ReturnType<typeof setInterval> | undefined;
  /** The gate a decision was taken for; a poll in flight can still return it. */
  #answered: string | null = null;

  constructor(runId: string, { onDecided = () => {}, pollMs = 2000 }: GalleryGateOptions = {}) {
    this.#runId = runId;
    this.#onDecided = onDecided;
    this.#pollMs = pollMs;
    this.#pollFailure = pollFailureNotifier(`gallery-gate-poll:${runId}`, 'Failed to load the gallery gate');
  }

  get waiting(): boolean {
    return this.gate !== null;
  }

  /** The gate's own candidates while it waits, otherwise those listed from disk. */
  get candidates(): CandidateResponse[] {
    return this.gate?.candidates ?? this.listed;
  }

  async refresh(): Promise<void> {
    try {
      const { gallery_gate: found } = await questionsApi.listQuestions(this.#runId);
      const next = found && found.question_id !== this.#answered ? found : null;
      if (next && next.question_id !== this.gate?.question_id) this.#clear();
      this.gate = next;
      if (!next) this.listed = (await runsApi.listCandidates(this.#runId)).candidates;
      this.#pollFailure.ok();
    } catch (err) {
      // The next poll retries; a run of failures toasts once, not every tick.
      this.#pollFailure.fail(err);
    }
  }

  start(): void {
    if (this.#timer) return;
    void this.refresh();
    this.#timer = setInterval(() => void this.refresh(), this.#pollMs);
  }

  stop(): void {
    clearInterval(this.#timer);
    this.#timer = undefined;
  }

  toggle(candidateId: string): void {
    this.selected = this.selected.includes(candidateId)
      ? this.selected.filter((id) => id !== candidateId)
      : [...this.selected, candidateId];
  }

  setNote(candidateId: string, note: string): void {
    this.notes[candidateId] = note;
  }

  async submit(decision: string): Promise<void> {
    const gate = this.gate;
    if (!gate || this.submitting) return;
    this.submitting = true;
    this.error = null;

    const comments: Record<string, string> = {};
    for (const [id, text] of Object.entries(this.notes)) {
      const trimmed = text.trim();
      if (trimmed) comments[id] = trimmed;
    }

    try {
      const response = await galleryApi.submitGalleryDecision(this.#runId, gate.question_id, {
        selected: [...this.selected],
        decision,
        comments,
      });
      if (response.success) {
        this.#answered = gate.question_id;
        // Keep the candidates on screen until the next listing arrives.
        this.listed = gate.candidates;
        this.gate = null;
        this.#clear();
        this.#onDecided();
      } else {
        this.error = response.error ?? 'decision not accepted';
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to submit decision';
    } finally {
      this.submitting = false;
    }
  }

  #clear(): void {
    this.selected = [];
    this.notes = {};
    this.error = null;
  }
}
