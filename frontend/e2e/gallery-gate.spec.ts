// ABOUTME: Gallery-gate E2E: real pipeline run, real candidate fixtures, real decision submit
// ABOUTME: Candidate screenshots are written directly to disk (not via render_capture -- this
// ABOUTME: dev environment has no headless Chromium for chromiumoxide to launch, same
// ABOUTME: constraint CandidateGallery.test.ts already documented), the DOT graph below skips
// ABOUTME: render_capture nodes entirely rather than expecting them to fail gracefully

import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Matches smasher-web's default_data_dir(): $SMASHER_DATA_DIR, else ~/.smasher.
const dataDir = process.env.SMASHER_DATA_DIR ?? join(homedir(), '.smasher');
const artifactsRoot = join(dataDir, 'artifacts');

// Same shape/attrs as examples/gallery_gate_showcase.dot's own Gate1 node,
// minus the 3 chained render_capture nodes that precede it there -- those
// launch a real headless Chromium via chromiumoxide, which this dev
// environment has no Chrome/Chromium binary for (confirmed: chromiumoxide's
// BrowserConfig::builder() has no explicit executable configured, and no
// google-chrome/chromium/chromium-browser binary is on PATH here). Reaching
// the gate directly from Start keeps this test runnable without that
// dependency, per the same precedent CandidateGallery.test.ts/Task 13 set:
// exercise the real gallery-gate API/UI against fixture files written
// straight to the artifacts dir, not a real render_capture execution.
const galleryGateDot = `
digraph GalleryGateE2E {
  graph [goal="Minimal gallery-gate round trip for Playwright E2E"];
  Start [shape=Mdiamond, label="Start"];
  Gate1 [shape=hexagon, label="Pick your favorite candidate(s)", gallery="true", candidate_count=3];
  Proceed [shape=box, label="Proceed"];
  Iterate [shape=box, label="Iterate"];
  Exit [shape=Msquare, label="Exit"];
  Start -> Gate1;
  Gate1 -> Proceed [label="proceed"];
  Gate1 -> Iterate [label="iterate"];
  Proceed -> Exit;
  Iterate -> Exit;
}
`;

function writeManifest(runId: string, candidateId: string, exitStatus: Record<string, unknown>) {
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

test('submit a gallery-gate pipeline, select a candidate, and complete via the real decision API', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(60000);

  let runId: string | undefined;

  try {
    const base = baseURL || 'http://127.0.0.1:5173';

    // Seed the run directly via the real POST /api/runs endpoint -- the
    // catalog's "paste DOT source" panel has been removed from the UI, so
    // this ad-hoc fixture graph (skipping the real render_capture nodes,
    // per the module comment above) has no UI submission path left.
    const submitResponse = await page.request.post(`${base}/api/runs`, {
      data: { dot_source: galleryGateDot, variables: {} },
    });
    ({ run_id: runId } = await submitResponse.json());
    expect(runId).toBeTruthy();

    await page.goto(`${base}/runs/${runId}`);
    await page.waitForLoadState('networkidle');

    // The pipeline pauses at Gate1 almost immediately (no LLM nodes before
    // it) -- write the 3 real candidate fixtures the gate expects
    // (candidate_count=3) directly to the run's artifacts dir.
    writeManifest(runId, 'candidate-a', { status: 'success' });
    writeManifest(runId, 'candidate-b', { status: 'success' });
    writeManifest(runId, 'candidate-c', { status: 'success' });

    // GalleryGate.svelte polls GET /api/runs/{id}/questions every 2s.
    await expect(page.getByText('Expected 3, found 3')).toBeVisible({ timeout: 15000 });

    // All three real candidates render as checkbox cards, keyed by their
    // real candidate_id from the manifest fixtures above.
    await expect(page.getByRole('checkbox', { name: 'candidate-a', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'candidate-b', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'candidate-c', exact: true })).toBeVisible();

    await page.getByRole('checkbox', { name: 'candidate-b', exact: true }).check();
    await page
      .getByLabel('Comment for candidate-b')
      .fill('Playwright E2E: picking candidate-b, testing the real decision round trip.');

    // Outgoing-edge decision buttons render the edge label verbatim
    // ("proceed"/"iterate" from the DOT above).
    await page.locator('button', { hasText: 'proceed' }).click();

    await expect(page.getByText('Decision recorded')).toBeVisible({ timeout: 10000 });

    // Start -> Gate1 -> Proceed -> Exit has no LLM nodes, so the pipeline
    // finishes essentially immediately once the decision is recorded.
    await expect(page.locator('text=Pipeline completed')).toBeVisible({ timeout: 15000 });

    const runResponse = await page.request.get(`${baseURL || 'http://127.0.0.1:5173'}/api/runs/${runId}`);
    expect((await runResponse.json()).status).toBe('Completed');

    // Task 15's decision history view shows the real recorded decision.
    const decisionsResponse = await page.request.get(
      `${baseURL || 'http://127.0.0.1:5173'}/api/runs/${runId}/decisions`
    );
    const decisions = (await decisionsResponse.json()).decisions as Array<{
      decision: string;
      selected: string[];
    }>;
    expect(decisions).toHaveLength(1);
    expect(decisions[0].decision).toBe('proceed');
    expect(decisions[0].selected).toEqual(['candidate-b']);
  } finally {
    if (runId) {
      rmSync(join(artifactsRoot, runId), { recursive: true, force: true });
    }
  }
});
