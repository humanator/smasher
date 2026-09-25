// ABOUTME: Tests for CandidatePreview: the screenshot thumbnail button and its full-size lightbox
// ABOUTME: Candidates are seeded on disk for a real gate-only run and read back through the real API

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import CandidatePreview from '../../../src/components/dashboard/CandidatePreview.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import type { CandidateResponse } from '../../../src/lib/api/runs';

// Parks on its human gate, so no LLM node ever runs.
const gatedDot = `digraph CandidatePreviewGated {
  start [shape=circle];
  gate [shape=oval, label="Proceed?"];
  done [shape=doublecircle];
  start -> gate -> done;
}`;

// Matches smasher-web's default_data_dir(): $SMASHER_DATA_DIR, else ~/.smasher.
const dataDir = process.env.SMASHER_DATA_DIR ?? join(homedir(), '.smasher');
const artifactsRoot = join(dataDir, 'artifacts');

// A 1×1 PNG, so the seeded screenshot is a real image file.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

let launched: string[] = [];

interface Seed {
  viewport?: { width: number; height: number };
  bundle?: boolean;
}

// Seeds one candidate for a new gated run and returns it as the real API reports it.
async function seededCandidate(candidateId: string, seed: Seed = {}): Promise<CandidateResponse> {
  const { run_id: runId } = await runsApi.submitRun({
    dot_source: gatedDot,
    variables: { test: `candidate-preview-${candidateId}` },
  });
  launched.push(runId);

  const dir = join(artifactsRoot, runId, 'artifacts', candidateId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'screenshot.png'), PNG_1X1);
  const artifacts = [];
  if (seed.bundle) {
    mkdirSync(join(dir, 'bundle'), { recursive: true });
    writeFileSync(join(dir, 'bundle', 'index.html'), '<button>Count: 0</button>');
    artifacts.push({ kind: 'live_bundle', path: 'bundle/index.html' });
  }
  // smasher-web requires a viewport, so the no-viewport fallback is covered by viewportOf's tests.
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify({
      captured_at: '2026-09-25T07:00:00Z',
      viewport: seed.viewport ?? { width: 1280, height: 800 },
      candidate_dir: `/tmp/${candidateId}`,
      exit_status: { status: 'success' },
      artifacts,
      generation_params: {},
    })
  );

  const { candidates } = await runsApi.listCandidates(runId);
  const candidate = candidates.find((c) => c.candidate_id === candidateId);
  if (!candidate) throw new Error(`${candidateId} not listed by the API`);
  return candidate;
}

function renderPreview(candidate: CandidateResponse) {
  const user = userEvent.setup();
  render(CandidatePreview, { props: { candidate } });
  return user;
}

async function openLightbox(candidate: CandidateResponse) {
  const user = renderPreview(candidate);
  await user.click(
    screen.getByRole('button', { name: `Open preview of ${candidate.candidate_id}` })
  );
  const dialog = await screen.findByRole('dialog');
  return { user, dialog };
}

describe('CandidatePreview', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    // bits-ui's scroll lock clears this on a timer after the open dialog
    // unmounts; reset it so the next test's clicks aren't blocked.
    document.body.style.pointerEvents = '';
    await Promise.all(launched.map((id) => runsApi.cancelRun(id).catch(() => {})));
    for (const id of launched) rmSync(join(artifactsRoot, id), { recursive: true, force: true });
    launched = [];
  });

  describe('thumbnail', () => {
    it('is a button holding the screenshot, with no iframe', async () => {
      const candidate = await seededCandidate('cand-thumb', {
        viewport: { width: 1280, height: 800 },
        bundle: true,
      });
      renderPreview(candidate);

      const button = screen.getByRole('button', { name: 'Open preview of cand-thumb' });
      const img = button.querySelector('img');
      expect(img?.getAttribute('src')).toBe(candidate.screenshot_url);
      expect(img?.getAttribute('alt')).toBe('Candidate cand-thumb');
      expect(document.querySelector('iframe')).toBeNull();
    });

    it('takes its aspect ratio from the manifest viewport', async () => {
      const candidate = await seededCandidate('cand-phone', {
        viewport: { width: 390, height: 844 },
      });
      renderPreview(candidate);

      const button = screen.getByRole('button', { name: 'Open preview of cand-phone' });
      expect(button.getAttribute('style')).toContain('aspect-ratio: 390 / 844');
    });
  });

  describe('lightbox', () => {
    it('opens a dialog titled with the candidate id', async () => {
      const candidate = await seededCandidate('cand-title', { bundle: true });
      const { dialog } = await openLightbox(candidate);

      expect(screen.getByRole('heading', { name: 'cand-title' })).toBeTruthy();
      expect(dialog.textContent).toContain('cand-title');
    });

    it('with a bundle, shows a sandboxed iframe of it at the capture viewport', async () => {
      const candidate = await seededCandidate('cand-bundle', {
        viewport: { width: 1440, height: 900 },
        bundle: true,
      });
      const { dialog } = await openLightbox(candidate);

      const iframe = dialog.querySelector('iframe');
      expect(iframe).not.toBeNull();
      expect(iframe?.getAttribute('src')).toBe(candidate.bundle_url);
      expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts');
      expect(iframe?.getAttribute('title')).toBe('Candidate cand-bundle');
      expect(iframe?.getAttribute('style')).toContain('width: 1440px');
      expect(iframe?.getAttribute('style')).toContain('height: 900px');
    });

    it('without a bundle, shows the full-size screenshot and no iframe', async () => {
      const candidate = await seededCandidate('cand-shot', {
        viewport: { width: 1280, height: 800 },
      });
      const { dialog } = await openLightbox(candidate);

      expect(dialog.querySelector('iframe')).toBeNull();
      const img = dialog.querySelector('img');
      expect(img?.getAttribute('src')).toBe(candidate.screenshot_url);
      expect(img?.getAttribute('style')).toContain('width: 1280px');
      expect(img?.getAttribute('style')).toContain('height: 800px');
    });

    it('closes on Escape', async () => {
      const candidate = await seededCandidate('cand-escape', { bundle: true });
      const { user } = await openLightbox(candidate);

      await user.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('closes with the close button', async () => {
      const candidate = await seededCandidate('cand-close', { bundle: true });
      const { user } = await openLightbox(candidate);

      await user.click(screen.getByRole('button', { name: 'Close' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });
  });
});
