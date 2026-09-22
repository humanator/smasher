// ABOUTME: Tests for the gallery-gate decision REST client
// ABOUTME: Calls the REAL smasher-web-api instance, not mocked fetch

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import * as gallery from '../../../src/lib/api/gallery';
import * as runsApi from '../../../src/lib/api/runs';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';

const BASE_URL = 'http://127.0.0.1:21541';
const API_URL = `${BASE_URL}/api`;

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

async function submitAndWaitForGalleryGate(): Promise<{ runId: string; questionId: string }> {
  const submitResp = await runsApi.submitRun({ dot_source: galleryGateDot, variables: {} });
  const runId = submitResp.run_id;

  // Real render_capture nodes fail on a machine with no headless Chromium
  // reachable, so the gate pauses with a plain (non-gallery) question until
  // real candidates exist on disk. Write them directly, same technique as
  // CandidateGallery.test.ts, then poll until the backend picks them up and
  // classifies the pending question as a gallery gate.
  for (let i = 0; i < 40; i++) {
    const resp = await fetch(`${API_URL}/runs/${runId}/questions`);
    const body = await resp.json();
    if (body.gallery_gate) {
      return { runId, questionId: body.gallery_gate.question_id };
    }
    if (i === 0) {
      writeCandidateManifest(runId, 'candidate-a');
      writeCandidateManifest(runId, 'candidate-b');
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('gallery gate never appeared for this run');
}

describe('gallery API client - REAL API INTEGRATION TESTS', () => {
  beforeAll(() => {
    setApiBaseUrl(API_URL);
  });

  it('submits a real decision and resumes the paused run', async () => {
    const { runId, questionId } = await submitAndWaitForGalleryGate();

    const result = await gallery.submitGalleryDecision(runId, questionId, {
      selected: ['candidate-a'],
      decision: 'proceed',
      comments: {},
    });

    expect(result.success).toBe(true);
  }, 20000);

  it('surfaces the backend comment-length-cap error message, not a bare HTTP 400', async () => {
    const { runId, questionId } = await submitAndWaitForGalleryGate();

    const overlong = 'x'.repeat(4001);

    await expect(
      gallery.submitGalleryDecision(runId, questionId, {
        selected: ['candidate-a'],
        decision: 'proceed',
        comments: { 'candidate-a': overlong },
      })
    ).rejects.toThrow(/exceeds 4000 characters/);
  }, 20000);
});
