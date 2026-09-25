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
  artifacts: Array<{ kind: string; path: string }> = [],
  generationParams: Record<string, string> = {}
) {
  const dir = join(artifactsRoot, runId, 'artifacts', candidateId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify({
      captured_at: '2026-09-25T07:00:00Z',
      viewport: { width: 1280, height: 800 },
      candidate_dir: `/tmp/${candidateId}`,
      exit_status: exitStatus,
      artifacts,
      generation_params: generationParams,
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

    // Every live candidate, bundle or not, is a screenshot thumbnail; no card embeds an iframe.
    for (const id of ['candidate-a', 'candidate-b']) {
      const thumbnail = screen.getByRole('button', { name: `Open preview of ${id}` });
      expect(thumbnail.querySelector('img')?.getAttribute('alt')).toBe(`Candidate ${id}`);
    }
    expect(screen.queryByRole('button', { name: 'Open preview of candidate-c' })).toBeNull();
    expect(document.querySelector('iframe')).toBeNull();

    // candidate-c: failed card shows its reason, no embed
    expect(screen.getByText('render timed out')).toBeTruthy();
  });

  it('lists generation_params in a collapsed params section, and leaves it out when empty', async () => {
    const submitResp = await runsApi.submitRun({
      dot_source: gatedDot,
      variables: { test: 'candidate-gallery-params' },
    });
    const runId = submitResp.run_id;

    writeManifest(runId, 'candidate-a', { status: 'success' }, [], {
      temperature: '0.4',
      seed: '7',
    });
    writeManifest(runId, 'candidate-b', { status: 'success' });

    render(CandidateGallery, { props: { runId } });
    await waitFor(() => {
      expect(screen.getByText('candidate-a')).toBeTruthy();
      expect(screen.getByText('candidate-b')).toBeTruthy();
    });

    const summaries = screen.getAllByText('params');
    expect(summaries.length).toBe(1);
    const details = summaries[0].closest('details');
    expect(details?.open).toBe(false);
    expect(details?.closest('.candidate-card')?.textContent).toContain('candidate-a');
    // The API sends generation_params sorted by key.
    const rows = Array.from(details?.querySelectorAll('li') ?? []).map((li) => li.textContent);
    expect(rows).toEqual(['seed: 7', 'temperature: 0.4']);
  });

  it("shows a failed candidate's id, then captured_at, then the reason", async () => {
    const submitResp = await runsApi.submitRun({
      dot_source: gatedDot,
      variables: { test: 'candidate-gallery-failed-captured-at' },
    });
    const runId = submitResp.run_id;

    writeManifest(runId, 'candidate-f', { status: 'failed', reason: 'render timed out' });
    // Shown raw, exactly as the API sends it.
    const { candidates } = await runsApi.listCandidates(runId);
    const capturedAt = candidates[0].manifest.captured_at as string;
    expect(capturedAt).toMatch(/^2026-09-25T07:00:00/);

    render(CandidateGallery, { props: { runId } });
    await waitFor(() => expect(screen.getByText('render timed out')).toBeTruthy());

    const card = screen.getByText('render timed out').closest('.candidate-card');
    const text = card?.textContent ?? '';
    expect(text).toContain(capturedAt);
    expect(text.indexOf('candidate-f')).toBeLessThan(text.indexOf(capturedAt));
    expect(text.indexOf(capturedAt)).toBeLessThan(text.indexOf('render timed out'));
  });
});
