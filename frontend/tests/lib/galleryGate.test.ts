// ABOUTME: Tests for GalleryGateState, which follows a run's gallery gate and holds the selection and notes for it
// ABOUTME: Real runs parked on a real gallery gate, candidate manifests written to the backend's artifacts dir

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import { toast } from 'svelte-sonner';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { GalleryGateState } from '../../src/lib/galleryGate.svelte';
import { Toaster } from '../../src/lib/components/ui/sonner/index.js';
import { setApiBaseUrl } from '../../src/lib/api/client-config';
import * as galleryApi from '../../src/lib/api/gallery';
import * as questionsApi from '../../src/lib/api/questions';
import * as runsApi from '../../src/lib/api/runs';
import { ANONYMOUS_GATE, GALLERY_GATE, cancelAll, submitGraph } from '../fixtures/graphs';

const dataDir = process.env.SMASHER_DATA_DIR ?? join(homedir(), 'Documents', 'smasher');
const artifactsRoot = join(dataDir, 'artifacts');

function writeManifest(runId: string, candidateId: string, exitStatus: Record<string, unknown> = { status: 'success' }) {
  const dir = join(artifactsRoot, runId, 'artifacts', candidateId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify({
      captured_at: new Date().toISOString(),
      viewport: { width: 1280, height: 800 },
      candidate_dir: `/tmp/${candidateId}`,
      exit_status: exitStatus,
      artifacts: [],
      generation_params: {},
    })
  );
}

const seedTwo = (runId: string) => {
  writeManifest(runId, 'candidate-a');
  writeManifest(runId, 'candidate-b');
};

async function runAtGate(dot = GALLERY_GATE, seed: (runId: string) => void = seedTwo): Promise<string> {
  const runId = await submitGraph(dot);
  for (let i = 0; i < 40; i++) {
    if (i === 0) seed(runId);
    if ((await questionsApi.listQuestions(runId)).gallery_gate) return runId;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('gallery gate never appeared for this run');
}

let states: GalleryGateState[] = [];

function follow(runId: string, options: ConstructorParameters<typeof GalleryGateState>[1] = {}) {
  const state = new GalleryGateState(runId, options);
  states.push(state);
  return state;
}

describe('GalleryGateState', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    states.forEach((s) => s.stop());
    states = [];
    await cancelAll();
  });

  describe('following the gate', () => {
    it("picks up the real gate: its question, edges and the candidates it found", async () => {
      const state = follow(await runAtGate());

      await state.refresh();

      expect(state.gate?.outgoing_edges.sort()).toEqual(['iterate', 'proceed']);
      expect(state.gate?.question_id).toBeTruthy();
      expect(state.candidates.map((c) => c.candidate_id).sort()).toEqual(['candidate-a', 'candidate-b']);
      expect(state.waiting).toBe(true);
    });

    it('lists the candidates of a run with no gallery gate (finished, or parked elsewhere)', async () => {
      const runId = await submitGraph(ANONYMOUS_GATE);
      writeManifest(runId, 'candidate-a');
      const state = follow(runId);

      await state.refresh();

      expect(state.gate).toBeNull();
      expect(state.waiting).toBe(false);
      expect(state.candidates.map((c) => c.candidate_id)).toEqual(['candidate-a']);
    });

    it('has nothing for a run with no candidates', async () => {
      const state = follow(await submitGraph(ANONYMOUS_GATE));

      await state.refresh();

      expect(state.candidates).toEqual([]);
    });

    it('polls on its own once started, and stops when told to', async () => {
      const runId = await submitGraph(ANONYMOUS_GATE);
      const state = follow(runId, { pollMs: 100 });
      state.start();
      writeManifest(runId, 'candidate-late');

      await waitFor(() => expect(state.candidates.map((c) => c.candidate_id)).toEqual(['candidate-late']));

      state.stop();
      writeManifest(runId, 'candidate-later');
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(state.candidates.map((c) => c.candidate_id)).toEqual(['candidate-late']);
    });
  });

  describe('selection and notes', () => {
    it('toggles a candidate in and out of the selection, keeping the order it was chosen in', async () => {
      const state = follow(await runAtGate());

      state.toggle('candidate-b');
      state.toggle('candidate-a');
      expect(state.selected).toEqual(['candidate-b', 'candidate-a']);
      state.toggle('candidate-b');
      expect(state.selected).toEqual(['candidate-a']);
    });

    it('keeps the selection and notes through the next poll', async () => {
      const state = follow(await runAtGate());
      await state.refresh();
      state.toggle('candidate-a');
      state.setNote('candidate-a', 'keep the header');

      await state.refresh();
      await state.refresh();

      expect(state.selected).toEqual(['candidate-a']);
      expect(state.notes).toEqual({ 'candidate-a': 'keep the header' });
    });
  });

  describe('submitting a decision', () => {
    it('sends the selection and trimmed notes, drops blank ones, and resumes the real run', async () => {
      const runId = await runAtGate();
      const onDecided = vi.fn();
      const state = follow(runId, { onDecided });
      await state.refresh();
      state.toggle('candidate-a');
      state.setNote('candidate-a', '  looks great  ');
      state.setNote('candidate-b', '   ');

      await state.submit('proceed');

      expect(state.error).toBeNull();
      expect(state.gate).toBeNull();
      expect(state.selected).toEqual([]);
      expect(onDecided).toHaveBeenCalledTimes(1);
      const { decisions } = await runsApi.listDecisions(runId);
      expect(decisions).toHaveLength(1);
      expect(decisions[0]).toMatchObject({
        decision: 'proceed',
        selected: ['candidate-a'],
        comments: { 'candidate-a': 'looks great' },
      });
      await waitFor(async () => expect((await questionsApi.listQuestions(runId)).gallery_gate).toBeNull());
    });

    it('keeps showing the candidates after the gate is answered, and does not bring the gate back', async () => {
      const state = follow(await runAtGate());
      await state.refresh();
      state.toggle('candidate-a');

      await state.submit('proceed');
      await state.refresh();

      expect(state.gate).toBeNull();
      expect(state.candidates.map((c) => c.candidate_id).sort()).toEqual(['candidate-a', 'candidate-b']);
    });

    it('submits once, however many times it is asked while the request is out', async () => {
      const state = follow(await runAtGate());
      await state.refresh();
      state.toggle('candidate-a');
      const spy = vi.spyOn(galleryApi, 'submitGalleryDecision');

      const first = state.submit('proceed');
      expect(state.submitting).toBe(true);
      await Promise.all([first, state.submit('proceed'), state.submit('iterate')]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(state.submitting).toBe(false);
    });

    it('surfaces the comment-length-cap error instead of failing silently, and can be tried again', async () => {
      const runId = await runAtGate();
      const onDecided = vi.fn();
      const state = follow(runId, { onDecided });
      await state.refresh();
      state.toggle('candidate-a');
      state.setNote('candidate-a', 'x'.repeat(4001));

      await state.submit('proceed');

      expect(state.error).toMatch(/exceeds 4000 characters/i);
      expect(state.gate).not.toBeNull();
      expect(state.submitting).toBe(false);
      expect(onDecided).not.toHaveBeenCalled();

      state.setNote('candidate-a', 'short');
      await state.submit('proceed');
      expect(state.error).toBeNull();
      expect(state.gate).toBeNull();
    });

    it('does nothing when there is no gate to answer', async () => {
      const state = follow(await submitGraph(ANONYMOUS_GATE));
      const spy = vi.spyOn(galleryApi, 'submitGalleryDecision');

      await state.submit('approve');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('a gate that comes round again', () => {
    // Iterate goes back to the start, which reaches the gate a second time with a new question.
    const LOOPING = `digraph LoopingGallery {
      start [shape=Mdiamond]; exit [shape=Msquare];
      gate [shape=hexagon, label="Pick a favourite", gallery="true", candidate_count=2];
      start -> gate;
      gate -> start [label="iterate", loop_restart=true];
      gate -> exit [label="approve"];
    }`;

    it('shows the second gate with a clean slate, not as the first one answered', async () => {
      const runId = await runAtGate(LOOPING);
      const state = follow(runId, { pollMs: 150 });
      await state.refresh();
      const first = state.gate?.question_id;
      state.toggle('candidate-a');
      state.setNote('candidate-a', 'again please');

      await state.submit('iterate');
      state.start();

      await waitFor(() => expect(state.gate?.question_id).toBeTruthy(), { timeout: 8000 });
      expect(state.gate?.question_id).not.toBe(first);
      expect(state.selected).toEqual([]);
      expect(state.notes).toEqual({});
    });
  });

  describe('poll failure toasts', () => {
    // Live toasts only: a toast dismissed earlier can briefly re-render, marked data-removed, because sonner's store is global.
    const toasts = () => document.querySelectorAll('[data-sonner-toast][data-removed="false"]');

    afterEach(async () => {
      toast.dismiss();
      await waitFor(() => expect(toasts().length).toBe(0));
    });

    it('toasts a failing poll once, not on every tick', async () => {
      render(Toaster);
      const state = follow('no-such-run', { pollMs: 500 });
      state.start();

      expect(await screen.findByText('not found: run no-such-run', {}, { timeout: 5000 })).toBeTruthy();
      // Watch more failing ticks. The toast closes itself after sonner's 4s default, and no later failure brings it back.
      let most = 0;
      for (let waited = 0; waited < 6500; waited += 100) {
        most = Math.max(most, toasts().length);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      expect(most).toBe(1);
      expect(toasts().length).toBe(0);
    }, 15000);

    it('shows no toast for a real run that has no gallery gate', async () => {
      render(Toaster);
      const state = follow(await submitGraph(ANONYMOUS_GATE), { pollMs: 500 });
      state.start();

      await new Promise((resolve) => setTimeout(resolve, 2500));

      expect(toasts().length).toBe(0);
    }, 15000);
  });
});
