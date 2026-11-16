// ABOUTME: Gallery-gate E2E: real pipeline run, real candidate fixtures, real decision submit
// ABOUTME: Candidate screenshots are written directly to disk (not via render_capture -- this
// ABOUTME: dev environment has no headless Chromium for chromiumoxide to launch, same
// ABOUTME: constraint the Candidates tests already documented), the DOT graph below skips
// ABOUTME: render_capture nodes entirely rather than expecting them to fail gracefully

import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Matches smasher-web's default_data_dir(): $SMASHER_DATA_DIR, else ~/Documents/smasher.
const dataDir = process.env.SMASHER_DATA_DIR ?? join(homedir(), 'Documents', 'smasher');
const artifactsRoot = join(dataDir, 'artifacts');

// Same shape/attrs as examples/gallery_gate_showcase.dot's own Gate1 node,
// minus the 3 chained render_capture nodes that precede it there -- those
// launch a real headless Chromium via chromiumoxide, which this dev
// environment has no Chrome/Chromium binary for (confirmed: chromiumoxide's
// BrowserConfig::builder() has no explicit executable configured, and no
// google-chrome/chromium/chromium-browser binary is on PATH here). Reaching
// the gate directly from Start keeps this test runnable without that
// dependency, per the same precedent the Candidates tests set:
// exercise the real gallery-gate API/UI against fixture files written
// straight to the artifacts dir, not a real render_capture execution.
// Proceed/Iterate are conditionals, not Codergen boxes, so the decision
// passes straight to Exit without spending LLM tokens.
const galleryGateDot = `
digraph GalleryGateE2E {
  graph [goal="Minimal gallery-gate round trip for Playwright E2E"];
  Start [shape=Mdiamond, label="Start"];
  Gate1 [shape=hexagon, label="Pick your favorite candidate(s)", gallery="true", candidate_count=3];
  Proceed [shape=diamond, label="Proceed"];
  Iterate [shape=diamond, label="Iterate"];
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
    const submitted: { run_id: string } = await submitResponse.json();
    runId = submitted.run_id;
    expect(runId).toBeTruthy();

    await page.goto(`${base}/runs/${runId}`);
    await page.waitForLoadState('networkidle');

    // The pipeline pauses at Gate1 almost immediately (no LLM nodes before
    // it) -- write the 3 real candidate fixtures the gate expects
    // (candidate_count=3) directly to the run's artifacts dir.
    writeManifest(runId, 'candidate-a', { status: 'success' });
    writeManifest(runId, 'candidate-b', { status: 'success' });
    writeManifest(runId, 'candidate-c', { status: 'success' });

    // The run page's gallery state polls GET /api/runs/{id}/questions every 2s.
    await expect(page.getByText('Expected 3, found 3')).toBeVisible({ timeout: 15000 });

    // All three real candidates render as cards with a Select toggle, keyed by their
    // real candidate_id from the manifest fixtures above.
    await expect(page.getByRole('button', { name: 'Select candidate-a', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Select candidate-b', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Select candidate-c', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Select candidate-b', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Selected candidate-b', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.locator('.candidate-card', { hasText: 'candidate-b' }).getByRole('button', { name: 'Add a Note…' }).click();
    await page
      .getByLabel('Note for candidate-b')
      .fill('Playwright E2E: picking candidate-b, testing the real decision round trip.');

    // The Decision bar treats a "proceed" edge as approve, so it reads "Approve Selected" but
    // still submits the edge exactly as the gate spelled it.
    await page.getByRole('region', { name: 'Decision' }).getByRole('button', { name: 'Approve Selected' }).click();

    await expect(page.getByRole('heading', { name: 'Your decisions' })).toBeVisible({ timeout: 10000 });

    // Start -> Gate1 -> Proceed -> Exit has no LLM nodes, so the pipeline
    // finishes essentially immediately once the decision is recorded.
    await expect(page.getByTestId('run-hero')).toContainText(/Finished in/, { timeout: 15000 });

    const runResponse = await page.request.get(`${baseURL || 'http://127.0.0.1:5173'}/api/runs/${runId}`);
    expect((await runResponse.json()).status).toBe('Completed');

    // The recorded decision, as the Your decisions card shows it.
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
