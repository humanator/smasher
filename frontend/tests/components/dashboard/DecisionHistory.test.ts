// ABOUTME: Tests for DecisionHistory component
// ABOUTME: Renders against real GET /api/runs/{id}/decisions responses, no mocked fetch

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import DecisionHistory from '../../../src/components/dashboard/DecisionHistory.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import * as questionsApi from '../../../src/lib/api/questions';
import * as galleryApi from '../../../src/lib/api/gallery';

const galleryGateDot = readFileSync(
  join(process.cwd(), '..', 'examples', 'gallery_gate_showcase.dot'),
  'utf-8'
);

const dataDir = process.env.SMASHER_DATA_DIR ?? join(homedir(), '.smasher');
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

async function submitRunWithRecordedDecision(): Promise<string> {
  const submitResp = await runsApi.submitRun({ dot_source: galleryGateDot, variables: {} });
  const runId = submitResp.run_id;

  let questionId: string | null = null;
  for (let i = 0; i < 40; i++) {
    const resp = await questionsApi.listQuestions(runId);
    if (resp.gallery_gate) {
      questionId = resp.gallery_gate.question_id;
      break;
    }
    if (i === 0) {
      writeCandidateManifest(runId, 'candidate-a');
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!questionId) throw new Error('gallery gate never appeared for this run');

  await galleryApi.submitGalleryDecision(runId, questionId, {
    selected: ['candidate-a'],
    decision: 'proceed',
    comments: { 'candidate-a': 'looks great' },
  });

  return runId;
}

describe('DecisionHistory', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  it('shows an empty state for a real run with no recorded decisions yet', async () => {
    const submitResp = await runsApi.submitRun({
      dot_source: galleryGateDot,
      variables: { test: 'decision-history-empty' },
    });

    render(DecisionHistory, { props: { runId: submitResp.run_id } });

    await waitFor(() => {
      expect(screen.getByText('No decisions yet.')).toBeTruthy();
    });
  });

  it('renders a real recorded gallery-gate decision', async () => {
    const runId = await submitRunWithRecordedDecision();

    render(DecisionHistory, { props: { runId } });

    await waitFor(
      () => {
        expect(screen.getByText('Gate1')).toBeTruthy();
        expect(screen.getByText('proceed')).toBeTruthy();
        // "candidate-a" appears both in the selected-candidates row and as
        // the comment's <dt> label.
        expect(screen.getAllByText('candidate-a').length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('looks great')).toBeTruthy();
      },
      { timeout: 5000 }
    );
  }, 20000);
});
