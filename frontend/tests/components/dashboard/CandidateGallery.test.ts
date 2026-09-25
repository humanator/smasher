// ABOUTME: Tests for CandidateGallery component
// ABOUTME: Renders against real GET /api/runs/{id}/candidates responses, no mocked fetch.
// ABOUTME: Candidate manifests/scorecards are written directly to the real server's
// ABOUTME: artifacts dir (same technique smasher-web's own scan_candidates tests use)
// ABOUTME: rather than running an actual render_capture node, since that launches a
// ABOUTME: real headless Chromium via chromiumoxide which this dev machine has none of.

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import CandidateGallery from '../../../src/components/dashboard/CandidateGallery.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';

// Parks on its human gate, so no LLM node ever runs.
const gatedDot = `digraph CandidateGalleryGated {
  start [shape=circle];
  gate [shape=oval, label="Proceed?"];
  done [shape=doublecircle];
  start -> gate -> done;
}`;

// Matches smasher-web's default_data_dir(): $SMASHER_DATA_DIR, else ~/.smasher.
const dataDir = process.env.SMASHER_DATA_DIR ?? join(homedir(), '.smasher');
const artifactsRoot = join(dataDir, 'artifacts');

function writeManifest(
  runId: string,
  candidateId: string,
  exitStatus: Record<string, unknown>,
  artifacts: Array<{ kind: string; path: string }> = []
) {
  const dir = join(artifactsRoot, runId, 'artifacts', candidateId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify({
      captured_at: new Date().toISOString(),
      viewport: { width: 1280, height: 800 },
      candidate_dir: `/tmp/${candidateId}`,
      exit_status: exitStatus,
      artifacts,
      generation_params: {},
    })
  );
  return dir;
}

describe('CandidateGallery', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  it('renders loading state initially', () => {
    render(CandidateGallery, { props: { runId: 'nonexistent-run' } });
    expect(screen.getByText('Loading candidates...')).toBeTruthy();
  });

  it('shows an empty state for a real run with no candidates on disk', async () => {
    const submitResp = await runsApi.submitRun({
      dot_source: gatedDot,
      variables: { test: 'candidate-gallery-empty' },
    });

    render(CandidateGallery, { props: { runId: submitResp.run_id } });

    await waitFor(() => {
      expect(screen.getByText('No candidates yet.')).toBeTruthy();
    });
  });

  it('renders real candidates (screenshot-only, bundle, and failed) with scorecard data from the real API', async () => {
    const submitResp = await runsApi.submitRun({
      dot_source: gatedDot,
      variables: { test: 'candidate-gallery-real' },
    });
    const runId = submitResp.run_id;

    writeManifest(runId, 'candidate-a', { status: 'success' });
    const dirA = join(artifactsRoot, runId, 'artifacts', 'candidate-a');
    writeFileSync(
      join(dirA, 'lint-report.json'),
      JSON.stringify({
        checks: [{ name: 'token-adherence', passed: false, violations: ['raw hex color'] }],
      })
    );
    writeFileSync(
      join(dirA, 'synthesis-report.json'),
      JSON.stringify({ recommendation: 'iterate', reasons: ['lint failed'] })
    );

    writeManifest(runId, 'candidate-b', { status: 'success' }, [
      { kind: 'live_bundle', path: 'bundle/index.html' },
    ]);

    writeManifest(runId, 'candidate-c', { status: 'failed', reason: 'render timed out' });

    // Confirm the real, unmocked API surfaces what we just wrote to disk.
    const apiResponse = await runsApi.listCandidates(runId);
    expect(apiResponse.candidates.map((c) => c.candidate_id).sort()).toEqual([
      'candidate-a',
      'candidate-b',
      'candidate-c',
    ]);

    render(CandidateGallery, { props: { runId } });

    await waitFor(() => {
      expect(screen.getByText('candidate-a')).toBeTruthy();
      expect(screen.getByText('candidate-b')).toBeTruthy();
      expect(screen.getByText('candidate-c')).toBeTruthy();
    });

    // candidate-a: screenshot fallback + failing lint badge + violation + synthesis
    expect(screen.getByText('lint: fail')).toBeTruthy();
    expect(screen.getByText('raw hex color')).toBeTruthy();
    expect(screen.getByText('synthesis: iterate')).toBeTruthy();

    // candidate-b: bundle iframe instead of an <img>
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(1); // only candidate-a falls back to <img>
    expect(images[0].getAttribute('alt')).toContain('candidate-a');

    // candidate-c: failed card shows its reason, no embed
    expect(screen.getByText('render timed out')).toBeTruthy();
  });
});
