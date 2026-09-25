// ABOUTME: Candidate-preview E2E: gate thumbnails, the scaled live lightbox, ⟲, and Open in new tab
// ABOUTME: A gate-only run with three candidates seeded on disk (PNG + bundle, PNG only, neither)

import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Matches smasher-web's default_data_dir(): $SMASHER_DATA_DIR, else ~/.smasher.
const dataDir = process.env.SMASHER_DATA_DIR ?? join(homedir(), '.smasher');
const artifactsRoot = join(dataDir, 'artifacts');

// Same gate-only shape as gallery-gate.spec.ts: Start goes straight to the gallery gate,
// and Proceed/Iterate are conditionals, so nothing here can reach an LLM.
const galleryGateDot = `
digraph CandidatePreviewE2E {
  graph [goal="Candidate thumbnails and lightbox for Playwright E2E"];
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

// A 1×1 PNG, so the seeded screenshots are real images.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// A page with state to lose: ⟲ should put the count back to 0.
const COUNTER_BUNDLE = `<!doctype html>
<html><body>
<button onclick="n++; this.textContent = 'Count: ' + n">Count: 0</button>
<script>var n = 0;</script>
</body></html>`;

function seedCandidate(runId: string, candidateId: string, seed: { png: boolean; bundle: boolean }) {
  const dir = join(artifactsRoot, runId, 'artifacts', candidateId);
  mkdirSync(dir, { recursive: true });
  if (seed.png) writeFileSync(join(dir, 'screenshot.png'), PNG_1X1);
  const artifacts = [];
  if (seed.bundle) {
    mkdirSync(join(dir, 'bundle'), { recursive: true });
    writeFileSync(join(dir, 'bundle', 'index.html'), COUNTER_BUNDLE);
    artifacts.push({ kind: 'live_bundle', path: 'bundle/index.html' });
  }
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify({
      captured_at: new Date().toISOString(),
      viewport: { width: 1280, height: 800 },
      candidate_dir: `/tmp/${candidateId}`,
      exit_status: { status: 'success' },
      artifacts,
      generation_params: candidateId === 'cand-a' ? { seed: '7' } : {},
    })
  );
}

// The run page shows the gallery too; the gate's cards are the ones under test.
function thumbnail(page: Page, candidateId: string) {
  return page.locator('.gate-card').getByRole('button', { name: `Open preview of ${candidateId}` });
}

async function expectAllUnchecked(page: Page) {
  for (const id of ['cand-a', 'cand-b', 'cand-c']) {
    await expect(page.getByRole('checkbox', { name: id, exact: true })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  }
}

test('gate thumbnails open a scaled, interactive lightbox that never toggles the checkbox', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1024, height: 768 });

  const base = baseURL || 'http://127.0.0.1:5173';
  let runId: string | undefined;

  try {
    const submitResponse = await page.request.post(`${base}/api/runs`, {
      data: { dot_source: galleryGateDot, variables: {} },
    });
    ({ run_id: runId } = await submitResponse.json());
    expect(runId).toBeTruthy();

    seedCandidate(runId!, 'cand-a', { png: true, bundle: true });
    seedCandidate(runId!, 'cand-b', { png: true, bundle: false });
    seedCandidate(runId!, 'cand-c', { png: false, bundle: false });

    await page.goto(`${base}/runs/${runId}`);
    await expect(page.getByText('Expected 3, found 3')).toBeVisible({ timeout: 15000 });

    // Thumbnails: real screenshots load through the dev proxy; a missing one shows the tile.
    for (const id of ['cand-a', 'cand-b']) {
      await expect
        .poll(() => thumbnail(page, id).locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0);
    }
    await expect(thumbnail(page, 'cand-c')).toHaveText('No screenshot');
    await expect(page.locator('iframe')).toHaveCount(0);

    // Params open inside the gate's <label> without the click reaching its checkbox.
    const params = page.locator('.gate-card details');
    await params.getByText('params').click();
    await expect(params.getByText('seed: 7')).toBeVisible();
    await expectAllUnchecked(page);

    // cand-a: the live bundle, scaled down to fit a 1024×768 window.
    await thumbnail(page, 'cand-a').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'cand-a' })).toBeVisible();
    const iframe = dialog.locator('iframe[title="Candidate cand-a"]');
    await expect(iframe).toBeVisible();

    // The first frame renders unscaled, until the stage has measured itself.
    await expect
      .poll(async () => {
        const b = (await iframe.boundingBox())!;
        return b.x + b.width;
      })
      .toBeLessThanOrEqual(1024);
    const box = (await iframe.boundingBox())!;
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(1024);
    expect(box.y + box.height).toBeLessThanOrEqual(768);
    // Scaled at the capture viewport's 16:10, not reflowed to the window.
    expect(box.width / box.height).toBeCloseTo(1280 / 800, 1);

    await page.setViewportSize({ width: 800, height: 600 });
    await expect.poll(async () => (await iframe.boundingBox())!.width).toBeLessThan(box.width);
    const resized = (await iframe.boundingBox())!;
    expect(resized.x + resized.width).toBeLessThanOrEqual(800);
    expect(resized.y + resized.height).toBeLessThanOrEqual(600);

    // The iframe stays clickable, its state survives a gate poll, and ⟲ resets it.
    const frame = page.frameLocator('iframe[title="Candidate cand-a"]');
    await frame.getByRole('button', { name: 'Count: 0' }).click();
    await expect(frame.getByRole('button', { name: 'Count: 1' })).toBeVisible();
    await page.waitForTimeout(2500);
    await expect(frame.getByRole('button', { name: 'Count: 1' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Reset preview to start' }).click();
    await expect(frame.getByRole('button', { name: 'Count: 0' })).toBeVisible();

    // Open in new tab goes to the bundle itself.
    const [popup] = await Promise.all([
      page.context().waitForEvent('page'),
      dialog.getByRole('link', { name: 'Open in new tab' }).click(),
    ]);
    await popup.waitForLoadState();
    expect(popup.url()).toMatch(/\/candidate-artifacts\/.+\/cand-a\/bundle\/index\.html$/);
    await expect(popup.getByRole('button', { name: 'Count: 0' })).toBeVisible();
    await popup.close();

    // Clicking the overlay, outside the dialog, closes it.
    await page.mouse.click(4, 4);
    await expect(dialog).toHaveCount(0);

    // cand-b: no bundle, so the full screenshot and no ⟲.
    await thumbnail(page, 'cand-b').click();
    await expect(dialog.getByRole('img', { name: 'Candidate cand-b' })).toBeVisible();
    await expect(dialog.locator('iframe')).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Reset preview to start' })).toHaveCount(0);
    await expect(dialog.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute(
      'href',
      /\/cand-b\/screenshot\.png$/
    );
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    await expectAllUnchecked(page);
  } finally {
    if (runId) {
      await page.request.post(`${base}/api/runs/${runId}/cancel`).catch(() => {});
      rmSync(join(artifactsRoot, runId), { recursive: true, force: true });
    }
  }
});
