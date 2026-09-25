// ABOUTME: Tests for GalleryGate component
// ABOUTME: Renders against a real paused gallery-gate run, no mocked fetch

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import GalleryGate from '../../../src/components/dashboard/GalleryGate.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import * as questionsApi from '../../../src/lib/api/questions';

// The showcase's Proceed/Iterate are Codergen (box) nodes, so a decision
// would start a real LLM call. As conditionals they just pass the run on to Exit.
const galleryGateDot = readFileSync(
  join(process.cwd(), '..', 'examples', 'gallery_gate_showcase.dot'),
  'utf-8'
).replace(/\[shape=box,/g, '[shape=diamond,');

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

async function submitAndWaitForGalleryGate(): Promise<string> {
  const submitResp = await runsApi.submitRun({ dot_source: galleryGateDot, variables: {} });
  const runId = submitResp.run_id;

  for (let i = 0; i < 40; i++) {
    const resp = await questionsApi.listQuestions(runId);
    if (resp.gallery_gate) {
      return runId;
    }
    if (i === 0) {
      writeCandidateManifest(runId, 'candidate-a');
      writeCandidateManifest(runId, 'candidate-b');
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('gallery gate never appeared for this run');
}

describe('GalleryGate', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  it('renders the real gate card with candidate checkboxes, comments, and decision buttons', async () => {
    const runId = await submitAndWaitForGalleryGate();

    render(GalleryGate, { props: { runId } });

    await waitFor(
      () => {
        expect(screen.getByRole('checkbox', { name: /candidate-a/i })).toBeTruthy();
        expect(screen.getByRole('checkbox', { name: /candidate-b/i })).toBeTruthy();
      },
      { timeout: 5000 }
    );

    expect(screen.getByRole('button', { name: 'proceed' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'iterate' })).toBeTruthy();
  }, 20000);

  it('surfaces the comment-length-cap error in the UI instead of failing silently', async () => {
    const runId = await submitAndWaitForGalleryGate();
    const user = userEvent.setup();

    render(GalleryGate, { props: { runId } });

    const commentBox = await waitFor(
      () => screen.getByLabelText(/comment.*candidate-a/i) as HTMLTextAreaElement,
      { timeout: 5000 }
    );
    await user.type(commentBox, 'x'.repeat(4001));

    await user.click(screen.getByRole('button', { name: 'proceed' }));

    await waitFor(
      () => {
        expect(screen.getByText(/exceeds 4000 characters/i)).toBeTruthy();
      },
      { timeout: 5000 }
    );
  }, 30000);

  it('submitting a valid decision resumes the real run', async () => {
    const runId = await submitAndWaitForGalleryGate();
    const user = userEvent.setup();

    render(GalleryGate, { props: { runId } });

    const checkbox = await waitFor(
      () => screen.getByRole('checkbox', { name: /candidate-a/i }),
      { timeout: 5000 }
    );
    await user.click(checkbox);
    await user.click(screen.getByRole('button', { name: 'proceed' }));

    await waitFor(
      async () => {
        const resp = await questionsApi.listQuestions(runId);
        expect(resp.gallery_gate).toBeNull();
      },
      { timeout: 5000 }
    );
  }, 20000);
});
