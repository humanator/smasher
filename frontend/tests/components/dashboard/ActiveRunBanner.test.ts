// ABOUTME: Tests for ActiveRunBanner, the workflow page's banner for its active run
// ABOUTME: Stand-in runs and questions with the clock and time zone pinned, so the wording is exact

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/svelte/svelte5';
import ActiveRunBanner from '../../../src/components/dashboard/ActiveRunBanner.svelte';
import type { RunSummary, CandidateResponse } from '../../../src/lib/api/runs';
import type { ListQuestionsResponse, Question } from '../../../src/lib/api/questions';

// 1:52:30 pm on Friday 16 October 2026 in Sydney.
const NOW = new Date('2026-10-16T02:52:30Z');
const TZ = 'Australia/Sydney';
const LABELS = new Map([['pick', 'Pick a favourite'], ['approve', 'Approve the plan']]);

function run(id: string, extra: Partial<RunSummary> = {}): RunSummary {
  return {
    id,
    status: 'Running',
    started_at: '2026-10-16T02:31:00Z',
    completed_at: null,
    graph_name: 'design_concepts_review',
    error: null,
    input_tokens: 0,
    output_tokens: 0,
    run_working_dir: null,
    workflow_id: 'design',
    gallery_gates: [],
    pending_questions: 0,
    waiting_since: null,
    ...extra,
  };
}

function question(kind: Question['kind'], node_id?: string): Question {
  return { id: 'q1', question: 'Proceed?', choices: [], kind, ...(node_id ? { node_id } : {}) };
}

const GALLERY: ListQuestionsResponse = {
  questions: [question('multiple_choice', 'pick')],
  gallery_gate: {
    question_id: 'q1',
    candidates: [{}, {}, {}] as CandidateResponse[],
    expected_count: 3,
    outgoing_edges: [],
  },
};

function renderBanner(
  runs: RunSummary[],
  fetchQuestions: (runId: string) => Promise<ListQuestionsResponse> = vi.fn(async () => GALLERY)
) {
  render(ActiveRunBanner, { props: { runs, labels: LABELS, fetchQuestions, now: NOW, timeZone: TZ } });
  return fetchQuestions;
}

function banner() {
  return screen.queryByRole('region', { name: 'Active run' });
}

function text(el: HTMLElement) {
  return el.textContent?.replace(/\s+/g, ' ').trim();
}

describe('ActiveRunBanner', () => {
  it('renders nothing when no run is active', () => {
    const fetchQuestions = renderBanner([run('done', { status: 'Completed', completed_at: '2026-10-16T02:40:00Z' })]);
    expect(banner()).toBeNull();
    expect(fetchQuestions).not.toHaveBeenCalled();
  });

  it('says when a running run started and how long it has run, with an Open Run link', () => {
    const fetchQuestions = renderBanner([run('run-7f3a9c')]);

    const section = banner()!;
    expect(within(section).getByRole('link', { name: 'run-7f3a9c' })).toHaveAttribute('href', '/runs/run-7f3a9c');
    expect(within(section).getByText('Running')).toBeTruthy();
    expect(within(section).getByText('Started today, 1:31 pm · 21 min 30 s so far')).toBeTruthy();
    expect(within(section).getByRole('link', { name: 'Open Run' })).toHaveAttribute('href', '/runs/run-7f3a9c');
    expect(fetchQuestions).not.toHaveBeenCalled();
  });

  it('says where a gallery gate paused and what it waits for, with Review Candidates', async () => {
    const fetchQuestions = renderBanner([run('run-7f3a9c', { pending_questions: 1 })]);

    const section = banner()!;
    expect(within(section).getByText('Needs you')).toBeTruthy();
    await waitFor(() =>
      expect(text(within(section).getByTestId('active-run-detail'))).toBe(
        'Started today, 1:31 pm. Paused at Pick a favourite, waiting for you to choose from 3 candidates.'
      )
    );
    expect(within(section).getByText('Pick a favourite').tagName).toBe('STRONG');
    expect(within(section).getByRole('link', { name: 'Review Candidates' })).toHaveAttribute('href', '/runs/run-7f3a9c');
    expect(fetchQuestions).toHaveBeenCalledWith('run-7f3a9c');
  });

  it('words an approval with an Answer button', async () => {
    renderBanner(
      [run('run-1', { pending_questions: 1 })],
      vi.fn(async () => ({ questions: [question('approval', 'approve')], gallery_gate: null }))
    );

    const section = banner()!;
    await waitFor(() =>
      expect(text(within(section).getByTestId('active-run-detail'))).toBe(
        'Started today, 1:31 pm. Paused at Approve the plan, waiting for you to approve or reject it.'
      )
    );
    expect(within(section).getByRole('link', { name: 'Answer' })).toBeTruthy();
  });

  it('falls back to the step id when the graph has no label for it', async () => {
    renderBanner(
      [run('run-1', { pending_questions: 1 })],
      vi.fn(async () => ({ questions: [question('free_form', 'mystery')], gallery_gate: null }))
    );

    await waitFor(() => expect(text(screen.getByTestId('active-run-detail'))).toContain('Paused at mystery,'));
  });

  it('leaves out "Paused at" when the question has no step', async () => {
    renderBanner(
      [run('run-1', { pending_questions: 1 })],
      vi.fn(async () => ({ questions: [question('free_form')], gallery_gate: null }))
    );

    await waitFor(() =>
      expect(text(screen.getByTestId('active-run-detail'))).toBe(
        'Started today, 1:31 pm. Waiting for you to answer a question.'
      )
    );
  });

  it('drops "Paused at" and offers Open Run when the questions fail to load', async () => {
    const fetchQuestions = renderBanner(
      [run('run-1', { pending_questions: 1 })],
      vi.fn(async () => {
        throw new Error('HTTP 500');
      })
    );

    await waitFor(() => expect(fetchQuestions).toHaveBeenCalled());
    const section = banner()!;
    expect(text(within(section).getByTestId('active-run-detail'))).toBe('Started today, 1:31 pm.');
    expect(within(section).getByRole('link', { name: 'Open Run' })).toBeTruthy();
  });

  it('features the newest active run and counts the rest', () => {
    renderBanner([run('newer'), run('older'), run('oldest'), run('done', { status: 'Failed' })]);

    const section = banner()!;
    expect(within(section).getByRole('link', { name: 'newer' })).toBeTruthy();
    expect(within(section).getByText('+ 2 more running')).toBeTruthy();
  });
});
