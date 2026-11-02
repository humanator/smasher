// ABOUTME: Tests for DecisionsCard, the run page's "Your decisions" list
// ABOUTME: Renders real recorded gallery-gate decisions from GET /api/runs/{id}/decisions, no mocked fetch

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/svelte/svelte5';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import DecisionsCard from '../../../src/components/run/DecisionsCard.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as galleryApi from '../../../src/lib/api/gallery';
import * as questionsApi from '../../../src/lib/api/questions';
import * as runsApi from '../../../src/lib/api/runs';
import type { DecisionResponse } from '../../../src/lib/api/runs';
import { stepLabels } from '../../../src/lib/runHero';
import { GALLERY_GATE_APPROVE, cancelAll, submitGraph } from '../../fixtures/graphs';

const dataDir = process.env.SMASHER_DATA_DIR ?? join(homedir(), 'Documents', 'smasher');
const artifactsRoot = join(dataDir, 'artifacts');

function writeCandidateManifest(runId: string, candidateId: string) {
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

// Takes a real decision at a real gate and returns what the server recorded, with the run's step labels.
async function recordDecision(decision: string, selected: string[], comments: Record<string, string> = {}) {
  const runId = await submitGraph(GALLERY_GATE_APPROVE);
  let questionId: string | null = null;
  for (let i = 0; i < 40 && !questionId; i++) {
    if (i === 0) writeCandidateManifest(runId, 'candidate-a');
    questionId = (await questionsApi.listQuestions(runId)).gallery_gate?.question_id ?? null;
    if (!questionId) await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!questionId) throw new Error('gallery gate never appeared for this run');
  await galleryApi.submitGalleryDecision(runId, questionId, { selected, decision, comments });
  const { decisions } = await runsApi.listDecisions(runId);
  const { nodes } = await runsApi.getRunSteps(runId);
  return { runId, decisions, labels: stepLabels(nodes) };
}

const decision = (overrides: Partial<DecisionResponse> = {}): DecisionResponse => ({
  node_id: 'gate',
  selected: [],
  decision: 'approve',
  comments: {},
  timestamp: '2026-09-25T07:00:00Z',
  ...overrides,
});

describe('DecisionsCard', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    await cancelAll();
  });

  it('renders nothing for a run with no recorded decisions', async () => {
    const runId = await submitGraph(GALLERY_GATE_APPROVE);
    const { decisions } = await runsApi.listDecisions(runId);
    expect(decisions).toEqual([]);

    const { container } = render(DecisionsCard, { props: { decisions, labels: new Map() } });

    expect(screen.queryByRole('heading', { name: 'Your decisions' })).toBeNull();
    expect(container.textContent?.trim()).toBe('');
  });

  it('renders a real recorded decision: the gate\'s plain title, Approved, the time, the selection and the note', async () => {
    const { decisions, labels } = await recordDecision('approve', ['candidate-a'], { 'candidate-a': 'looks great' });

    render(DecisionsCard, { props: { decisions, labels } });

    expect(screen.getByRole('heading', { level: 2, name: 'Your decisions' })).toBeTruthy();
    const card = screen.getByRole('listitem');
    expect(within(card).getByRole('heading', { level: 3, name: 'Pick a favourite' })).toBeTruthy();
    expect(within(card).getByText('Approved')).toBeTruthy();
    // The id is both a selected badge and the note's label.
    expect(within(card).getAllByText('candidate-a').length).toBeGreaterThanOrEqual(2);
    // Shown as the other pages show a time: a day word or a date, then the clock.
    expect(card.querySelector('time')?.textContent).toMatch(/(Today|Yesterday|\w{3} \d+ \w{3}).*(am|pm)/);
    expect(within(card).getByText('looks great')).toBeTruthy();
    expect(within(card).queryByText('Nothing selected')).toBeNull();
  });

  it('shows an iterate decision as Sent back, with Nothing selected when no candidate was picked', async () => {
    const { decisions, labels } = await recordDecision('iterate', []);

    render(DecisionsCard, { props: { decisions, labels } });

    const card = screen.getByRole('listitem');
    expect(within(card).getByText('Sent back')).toBeTruthy();
    expect(within(card).getByText('Nothing selected')).toBeTruthy();
  });

  it('falls back to the step id when it has no label, and words an unknown decision as the gate named it', () => {
    render(DecisionsCard, {
      props: { decisions: [decision({ node_id: 'Gate1', decision: 'skip' })], labels: new Map() },
    });

    const card = screen.getByRole('listitem');
    expect(within(card).getByRole('heading', { level: 3, name: 'Gate1' })).toBeTruthy();
    expect(within(card).getByText('skip')).toBeTruthy();
  });

  it('lists one card per decision, in the order recorded', () => {
    render(DecisionsCard, {
      props: {
        decisions: [
          decision({ decision: 'iterate', timestamp: '2026-09-25T07:00:00Z' }),
          decision({ decision: 'approve', selected: ['concept-b'], timestamp: '2026-09-25T07:10:00Z' }),
        ],
        labels: new Map(),
      },
    });

    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText('Sent back')).toBeTruthy();
    expect(within(cards[1]).getByText('Approved')).toBeTruthy();
  });
});
