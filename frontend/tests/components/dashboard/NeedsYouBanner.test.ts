// ABOUTME: Tests for NeedsYouBanner: which waiting run it features, how it words the wait, and its links
// ABOUTME: Stand-in library and questions fetcher for exact copy, plus one pass against a real waiting gate

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import NeedsYouBanner from '../../../src/components/dashboard/NeedsYouBanner.svelte';
import { createLibraryStore } from '../../../src/stores/library.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import type { RunSummary } from '../../../src/lib/api/runs';
import type { ListQuestionsResponse } from '../../../src/lib/api/questions';
import type { WorkflowSummary } from '../../../src/lib/api/workflows';
import { isNeedsYou, longestWaiting } from '../../../src/lib/runStatus';
import { ANONYMOUS_GATE, submitGraph, cancelAll } from '../../fixtures/graphs';

const NOW = new Date('2026-10-16T02:48:30Z');

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
    ...extra,
  };
}

const WORKFLOWS: WorkflowSummary[] = [
  { id: 'design', name: 'design_concepts_review', source_dir: 'workflows/design', path: 'design_concepts_review.dot' },
];

function library(runs: RunSummary[], workflows: WorkflowSummary[] = WORKFLOWS) {
  return { runs, workflows, needsYou: runs.filter(isNeedsYou) };
}

const GALLERY: ListQuestionsResponse = {
  questions: [{ id: 'q1', question: 'Pick one', choices: [], kind: 'multiple_choice' }],
  gallery_gate: {
    question_id: 'q1',
    candidates: [1, 2, 3].map((n) => ({
      candidate_id: `c${n}`,
      screenshot_url: '',
      manifest: {},
      scorecard: {},
    })),
    expected_count: 3,
    outgoing_edges: [],
  },
};

const APPROVAL: ListQuestionsResponse = {
  questions: [{ id: 'q1', question: 'Ship it?', choices: [], kind: 'approval' }],
  gallery_gate: null,
};

function banner() {
  return screen.queryByRole('region', { name: 'Waiting for you' });
}

describe('NeedsYouBanner', () => {
  it('renders nothing when no run is waiting on a person', () => {
    const fetchQuestions = vi.fn();
    render(NeedsYouBanner, {
      props: { library: library([run('busy', { pending_questions: 0, waiting_since: null })]), fetchQuestions, now: NOW },
    });

    expect(banner()).toBeNull();
    expect(fetchQuestions).not.toHaveBeenCalled();
  });

  it('words a gallery gate and links Review Candidates to the run', async () => {
    const fetchQuestions = vi.fn().mockResolvedValue(GALLERY);
    render(NeedsYouBanner, {
      props: { library: library([run('r1', { workflow_id: 'design' })]), fetchQuestions, now: NOW },
    });

    expect(banner()).not.toBeNull();
    expect(screen.getByText('Design Concepts Review is waiting for your decision')).toBeTruthy();
    expect(await screen.findByText('Pick a favourite · 3 candidates ready · waiting 6 minutes')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Review Candidates' })).toHaveAttribute('href', '/runs/r1');
    expect(fetchQuestions).toHaveBeenCalledWith('r1');
  });

  it('words an approval and links Answer to the run', async () => {
    const fetchQuestions = vi.fn().mockResolvedValue(APPROVAL);
    render(NeedsYouBanner, {
      props: { library: library([run('r1', { waiting_since: '2026-10-16T02:47:00Z' })]), fetchQuestions, now: NOW },
    });

    expect(screen.getByText('Graph r1 is waiting for your decision')).toBeTruthy();
    expect(await screen.findByText('Approve or reject · waiting 1 minute')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Answer' })).toHaveAttribute('href', '/runs/r1');
  });

  it('features the run that has waited longest and links to the rest', async () => {
    const fetchQuestions = vi.fn().mockResolvedValue(APPROVAL);
    const runs = [
      run('newer', { waiting_since: '2026-10-16T02:46:00Z' }),
      run('oldest', { waiting_since: '2026-10-16T01:40:00Z' }),
      run('middle', { waiting_since: '2026-10-16T02:00:00Z' }),
    ];
    render(NeedsYouBanner, { props: { library: library(runs), fetchQuestions, now: NOW } });

    expect(screen.getByText('Graph oldest is waiting for your decision')).toBeTruthy();
    expect(await screen.findByText('Approve or reject · waiting 1 hour')).toBeTruthy();
    expect(screen.getByRole('link', { name: '+ 2 more waiting' })).toHaveAttribute('href', '/?runs=needs-you#runs');
    expect(fetchQuestions).toHaveBeenCalledWith('oldest');
  });

  it('shows only the wait and Open Run when the questions cannot be fetched', async () => {
    const fetchQuestions = vi.fn().mockRejectedValue(new Error('boom'));
    render(NeedsYouBanner, { props: { library: library([run('r1')]), fetchQuestions, now: NOW } });

    expect(await screen.findByRole('link', { name: 'Open Run' })).toHaveAttribute('href', '/runs/r1');
    expect(screen.getByText('waiting 6 minutes')).toBeTruthy();
  });

  it('ignores an answer for a run it no longer features', async () => {
    let resolveFirst!: (value: ListQuestionsResponse) => void;
    const fetchQuestions = vi.fn((id: string) =>
      id === 'first' ? new Promise<ListQuestionsResponse>((resolve) => (resolveFirst = resolve)) : Promise.resolve(APPROVAL)
    );
    const { rerender } = render(NeedsYouBanner, {
      props: { library: library([run('first')]), fetchQuestions, now: NOW },
    });

    await rerender({ library: library([run('second')]), fetchQuestions, now: NOW });
    expect(await screen.findByText('Approve or reject · waiting 6 minutes')).toBeTruthy();

    resolveFirst(GALLERY);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/Pick a favourite/)).toBeNull();
  });

  it('asks again when the featured run gets another question', async () => {
    const fetchQuestions = vi.fn().mockResolvedValueOnce(APPROVAL).mockResolvedValueOnce(GALLERY);
    const { rerender } = render(NeedsYouBanner, {
      props: { library: library([run('r1')]), fetchQuestions, now: NOW },
    });
    await screen.findByText(/Approve or reject/);

    await rerender({ library: library([run('r1', { pending_questions: 2 })]), fetchQuestions, now: NOW });

    expect(await screen.findByText(/Pick a favourite/)).toBeTruthy();
    expect(fetchQuestions).toHaveBeenCalledTimes(2);
  });

  describe('with its own clock', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('refreshes the wait at least once a minute', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
      vi.setSystemTime(NOW);
      const fetchQuestions = vi.fn().mockResolvedValue(APPROVAL);
      render(NeedsYouBanner, { props: { library: library([run('r1')]), fetchQuestions } });
      expect(await screen.findByText('Approve or reject · waiting 6 minutes')).toBeTruthy();

      await vi.advanceTimersByTimeAsync(60_000);

      expect(screen.getByText('Approve or reject · waiting 7 minutes')).toBeTruthy();
    });
  });

  describe('real gate', () => {
    const stores: ReturnType<typeof createLibraryStore>[] = [];

    beforeAll(() => {
      setApiBaseUrl('http://127.0.0.1:21541/api');
    });

    afterEach(async () => {
      stores.splice(0).forEach((s) => s.stop());
      await cancelAll();
    });

    // The backend is shared with other test files, so other runs may be
    // waiting too: check against what the real store reports.
    it('features the real run that has waited longest, using the server\'s waiting_since', async () => {
      const id = await submitGraph(ANONYMOUS_GATE);
      const store = createLibraryStore(200);
      stores.push(store);
      store.start();

      render(NeedsYouBanner, { props: { library: store } });

      await waitFor(() => expect(store.needsYou.map((r) => r.id)).toContain(id), { timeout: 5000 });
      const oldest = longestWaiting(store.needsYou)!;
      expect(oldest.waiting_since).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      const action = await screen.findByRole('link', { name: /^(Answer|Review Candidates)$/ }, { timeout: 5000 });
      expect(action).toHaveAttribute('href', `/runs/${oldest.id}`);
      expect(screen.getByRole('region', { name: 'Waiting for you' }).textContent).toMatch(/waiting (less than a minute|\d+ (minute|hour)s?)/);
    }, 15_000);
  });
});
