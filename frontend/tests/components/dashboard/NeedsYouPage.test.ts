// ABOUTME: Tests for NeedsYouPage, the Needs you screen: a card per waiting question, answered right there
// ABOUTME: Answers real gates on the real smasher-web API; stand-in libraries only for the loading, error and empty states

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import { toast } from 'svelte-sonner';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import NeedsYouPage from '../../../src/components/dashboard/NeedsYouPage.svelte';
import { Toaster } from '../../../src/lib/components/ui/sonner/index.js';
import { createLibraryStore } from '../../../src/stores/library.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import * as questionsApi from '../../../src/lib/api/questions';
import type { RunSummary } from '../../../src/lib/api/runs';
import { isNeedsYou } from '../../../src/lib/runStatus';
import { GALLERY_GATE, QUESTION_KINDS, submitGraph, cancelAll } from '../../fixtures/graphs';

// Matches smasher-web's default_data_dir(): $SMASHER_DATA_DIR, else ~/Documents/smasher.
const artifactsRoot = join(process.env.SMASHER_DATA_DIR ?? join(homedir(), 'Documents', 'smasher'), 'artifacts');

function seedCandidate(runId: string, candidateId: string) {
  const dir = join(artifactsRoot, runId, 'artifacts', candidateId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify({
      captured_at: new Date().toISOString(),
      viewport: { width: 1280, height: 800 },
      candidate_dir: `/tmp/${candidateId}`,
      exit_status: { status: 'success' },
      artifacts: [],
      generation_params: {},
    })
  );
}

async function waitForQuestion(runId: string): Promise<void> {
  await waitFor(
    async () => {
      const response = await questionsApi.listQuestions(runId);
      expect(response.questions.length + (response.gallery_gate ? 1 : 0)).toBeGreaterThan(0);
    },
    { timeout: 10000, interval: 200 }
  );
}

// A store that polls every 300ms, so a run's next gate shows up quickly.
const stores: ReturnType<typeof createLibraryStore>[] = [];
function realLibrary() {
  const store = createLibraryStore(300);
  stores.push(store);
  store.start();
  return store;
}

function standIn(runs: RunSummary[], extra: Partial<{ loaded: boolean; error: string | null; refresh: () => Promise<void> }> = {}) {
  return { runs, needsYou: runs.filter(isNeedsYou), workflows: [], loaded: true, error: null, ...extra };
}

function run(id: string, extra: Partial<RunSummary> = {}): RunSummary {
  return {
    id,
    status: 'Running',
    started_at: '2026-10-16T02:30:00Z',
    completed_at: null,
    graph_name: `Graph ${id}`,
    error: null,
    input_tokens: 0,
    output_tokens: 0,
    run_working_dir: null,
    workflow_id: null,
    gallery_gates: [],
    pending_questions: 1,
    waiting_since: '2026-10-16T02:42:00Z',
    resumable: false,
    ...extra,
  };
}

// The cards for one run's waiting questions, once its questions have loaded.
async function cardsFor(runId: string, timeout = 8000): Promise<HTMLElement[]> {
  const selector = `[data-run-id="${runId}"]:not([aria-busy="true"])`;
  await waitFor(() => expect(document.querySelectorAll(selector).length).toBeGreaterThan(0), { timeout });
  return Array.from(document.querySelectorAll<HTMLElement>(selector));
}

describe('NeedsYouPage', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    stores.splice(0).forEach((s) => s.stop());
    await cancelAll();
  });

  describe('page states', () => {
    it('says it is loading before the library has loaded', () => {
      render(NeedsYouPage, { props: { library: standIn([], { loaded: false }) } });

      expect(screen.getByText('Loading…')).toBeTruthy();
      expect(screen.queryByText('Nothing needs you right now')).toBeNull();
    });

    it('shows the load error with Try Again before the library has loaded', async () => {
      const refresh = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(NeedsYouPage, { props: { library: standIn([], { loaded: false, error: 'connection refused', refresh }) } });

      expect(screen.getByRole('alert').textContent).toContain("Couldn't load what needs you: connection refused");
      await user.click(screen.getByRole('button', { name: 'Try Again' }));
      expect(refresh).toHaveBeenCalled();
    });

    it('says nothing needs you when no run is waiting', () => {
      render(NeedsYouPage, { props: { library: standIn([run('busy', { pending_questions: 0, waiting_since: null })]) } });

      expect(screen.getByText('Nothing needs you right now')).toBeTruthy();
      expect(document.querySelector('[data-run-id]')).toBeNull();
    });

    it("shows a card that says so when a run's questions can't be loaded", async () => {
      render(NeedsYouPage, { props: { library: standIn([run('no-such-run')]) } });

      const [card] = await cardsFor('no-such-run');
      expect(await within(card).findByText(/Couldn't load this question/, {}, { timeout: 5000 })).toBeTruthy();
      expect(within(card).getByRole('link', { name: 'Open run' })).toHaveAttribute('href', '/runs/no-such-run');
    });

    it('puts the run that has waited longest first', async () => {
      const runs = [
        run('no-such-newer', { waiting_since: '2026-10-16T02:46:00Z' }),
        run('no-such-oldest', { waiting_since: '2026-10-16T01:40:00Z' }),
      ];
      render(NeedsYouPage, { props: { library: standIn(runs), now: new Date('2026-10-16T02:48:30Z') } });

      await cardsFor('no-such-newer');
      const order = Array.from(document.querySelectorAll<HTMLElement>('[data-run-id]')).map((el) => el.dataset.runId);
      expect(order).toEqual(['no-such-oldest', 'no-such-newer']);
      expect(screen.getByText('waiting 1 hour')).toBeTruthy();
      expect(screen.getByText('waiting 2 minutes')).toBeTruthy();
    });
  });

  describe('answering against the real server', () => {
    it('answers a multiple-choice, an approval and a free-text question in turn, then the card goes', async () => {
      const runId = await submitGraph(QUESTION_KINDS);
      await waitForQuestion(runId);
      const user = userEvent.setup();
      render(NeedsYouPage, { props: { library: realLibrary() } });

      // Multiple choice: titled after the graph, with how long it has waited and a link to the run.
      let [card] = await cardsFor(runId);
      expect(within(card).getByRole('heading', { level: 2, name: 'QuestionKinds' })).toBeTruthy();
      expect(within(card).getByText('waiting less than a minute')).toBeTruthy();
      expect(within(card).getByRole('link', { name: 'Open run' })).toHaveAttribute('href', `/runs/${runId}`);
      const group = await within(card).findByRole('group', { name: 'Pick a colour' }, { timeout: 5000 });
      await user.click(within(group).getByRole('radio', { name: 'Blue' }));
      await user.click(within(card).getByRole('button', { name: 'Submit' }));

      // Approval.
      await waitFor(
        async () => {
          [card] = await cardsFor(runId);
          expect(within(card).getByText('Continue?')).toBeTruthy();
        },
        { timeout: 8000 }
      );
      await user.click(within(card).getByRole('button', { name: 'Yes' }));

      // Free text.
      let input!: HTMLElement;
      await waitFor(
        async () => {
          [card] = await cardsFor(runId);
          input = within(card).getByRole('textbox', { name: 'Say something' });
        },
        { timeout: 8000 }
      );
      await user.type(input, 'hello there');
      await user.click(within(card).getByRole('button', { name: 'Submit' }));

      await waitFor(() => expect(document.querySelector(`[data-run-id="${runId}"]`)).toBeNull(), { timeout: 8000 });
      await waitFor(async () => expect((await runsApi.getRun(runId)).status).toBe('Completed'), { timeout: 8000 });
    }, 40000);

    it('shows a gallery gate as a card that links to the run to review its candidates', async () => {
      const runId = await submitGraph(GALLERY_GATE);
      seedCandidate(runId, 'candidate-a');
      seedCandidate(runId, 'candidate-b');
      await waitFor(async () => expect((await questionsApi.listQuestions(runId)).gallery_gate).toBeTruthy(), {
        timeout: 10000,
        interval: 250,
      });
      render(NeedsYouPage, { props: { library: realLibrary() } });

      const [card] = await cardsFor(runId);
      expect(await within(card).findByText('Pick a favourite', {}, { timeout: 5000 })).toBeTruthy();
      expect(within(card).getByText('2 candidates ready')).toBeTruthy();
      expect(within(card).getByRole('link', { name: 'Review candidates' })).toHaveAttribute('href', `/runs/${runId}`);
      expect(within(card).queryByRole('button', { name: 'Submit' })).toBeNull();
      expect(within(card).queryByRole('radio')).toBeNull();
    });

    it('treats a gallery gate with no candidates yet the same way', async () => {
      const runId = await submitGraph(GALLERY_GATE);
      await waitForQuestion(runId);
      render(NeedsYouPage, { props: { library: realLibrary() } });

      const [card] = await cardsFor(runId);
      expect(await within(card).findByRole('link', { name: 'Review candidates' }, { timeout: 5000 })).toHaveAttribute(
        'href',
        `/runs/${runId}`
      );
      expect(within(card).queryByRole('button', { name: 'Submit' })).toBeNull();
    });

    describe('when an answer is rejected', () => {
      const toasts = () => document.querySelectorAll('[data-sonner-toast][data-removed="false"]');

      afterEach(async () => {
        toast.dismiss();
        await waitFor(() => expect(toasts().length).toBe(0));
      });

      it('toasts the error and keeps the card', async () => {
        const runId = await submitGraph(QUESTION_KINDS);
        await waitForQuestion(runId);
        const summary = await runsApi.getRun(runId);
        const user = userEvent.setup();
        render(Toaster);
        // A fixed library, so the card stays after the run is stopped below.
        render(NeedsYouPage, { props: { library: standIn([summary]) } });

        const [card] = await cardsFor(runId);
        const group = await within(card).findByRole('group', { name: 'Pick a colour' }, { timeout: 5000 });
        await runsApi.cancelRun(runId);
        await waitFor(async () => expect((await runsApi.getRun(runId)).status).toBe('Aborted'), { timeout: 5000 });
        await user.click(within(group).getByRole('radio', { name: 'Red' }));
        await user.click(within(card).getByRole('button', { name: 'Submit' }));

        await waitFor(() => expect(toasts()).toHaveLength(1), { timeout: 5000 });
        expect(document.querySelector(`[data-run-id="${runId}"]`)).not.toBeNull();
        await waitFor(() => expect(within(card).getByRole('button', { name: 'Submit' })).toBeEnabled());
      });
    });
  });
});
