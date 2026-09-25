// ABOUTME: Tests for GalleryGate component
// ABOUTME: Renders against a real paused gallery-gate run, no mocked fetch

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import { toast } from 'svelte-sonner';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import GalleryGate from '../../../src/components/dashboard/GalleryGate.svelte';
import { Toaster } from '../../../src/lib/components/ui/sonner/index.js';
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

let launched: string[] = [];

function writeCandidateManifest(
  runId: string,
  candidateId: string,
  overrides: Record<string, unknown> = {}
) {
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
      ...overrides,
    })
  );
}

function seedTwoCandidates(runId: string) {
  writeCandidateManifest(runId, 'candidate-a');
  writeCandidateManifest(runId, 'candidate-b');
}

async function submitAndWaitForGalleryGate(
  seed: (runId: string) => void = seedTwoCandidates
): Promise<string> {
  const submitResp = await runsApi.submitRun({ dot_source: galleryGateDot, variables: {} });
  const runId = submitResp.run_id;
  launched.push(runId);

  for (let i = 0; i < 40; i++) {
    const resp = await questionsApi.listQuestions(runId);
    if (resp.gallery_gate) {
      return runId;
    }
    if (i === 0) {
      seed(runId);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('gallery gate never appeared for this run');
}

describe('GalleryGate', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    // bits-ui's scroll lock clears this on a timer after the open dialog
    // unmounts; reset it so the next test's clicks aren't blocked.
    document.body.style.pointerEvents = '';
    await Promise.all(launched.map((id) => runsApi.cancelRun(id).catch(() => {})));
    launched = [];
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

  describe('candidate preview and params', () => {
    const checkbox = (id: string) => screen.getByRole('checkbox', { name: id });

    it('opens the lightbox from the thumbnail without toggling the checkbox', async () => {
      const runId = await submitAndWaitForGalleryGate();
      const user = userEvent.setup();
      render(GalleryGate, { props: { runId } });

      const thumbnail = await screen.findByRole(
        'button',
        { name: 'Open preview of candidate-a' },
        { timeout: 5000 }
      );
      await user.click(thumbnail);

      expect(await screen.findByRole('dialog')).toBeTruthy();
      expect(checkbox('candidate-a').getAttribute('aria-checked')).toBe('false');

      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(checkbox('candidate-a').getAttribute('aria-checked')).toBe('false');
    }, 20000);

    it('opens and closes the params section without toggling the checkbox', async () => {
      const runId = await submitAndWaitForGalleryGate((id) => {
        writeCandidateManifest(id, 'candidate-a', { generation_params: { seed: '7' } });
        writeCandidateManifest(id, 'candidate-b');
      });
      render(GalleryGate, { props: { runId } });

      const summary = await screen.findByText('params', {}, { timeout: 5000 });
      const details = summary.closest('details');
      expect(details?.closest('label')?.textContent).toContain('candidate-a');
      expect(screen.getByText('seed: 7')).toBeTruthy();

      // user-event's own <label> handling stops a <summary> inside one from toggling its
      // <details>; a dispatched click follows the DOM, as a browser does (see the e2e).
      await fireEvent.click(summary);
      expect(details?.open).toBe(true);
      expect(checkbox('candidate-a').getAttribute('aria-checked')).toBe('false');

      await fireEvent.click(summary);
      expect(details?.open).toBe(false);
      expect(checkbox('candidate-a').getAttribute('aria-checked')).toBe('false');
    }, 20000);

    it('keeps a selection and comment through the lightbox and the next poll', async () => {
      const runId = await submitAndWaitForGalleryGate();
      const user = userEvent.setup();
      render(GalleryGate, { props: { runId } });

      await user.click(await screen.findByRole('checkbox', { name: 'candidate-a' }, { timeout: 5000 }));
      await user.type(screen.getByLabelText('Comment for candidate-a'), 'keep the header');

      await user.click(screen.getByRole('button', { name: 'Open preview of candidate-a' }));
      await screen.findByRole('dialog');
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      // One 2s poll replaces the gate's candidates.
      await new Promise((resolve) => setTimeout(resolve, 2500));

      expect(checkbox('candidate-a').getAttribute('aria-checked')).toBe('true');
      expect(checkbox('candidate-b').getAttribute('aria-checked')).toBe('false');
      expect((screen.getByLabelText('Comment for candidate-a') as HTMLTextAreaElement).value).toBe(
        'keep the header'
      );
    }, 20000);

    it("leaves captured_at off the gate's failed card", async () => {
      const runId = await submitAndWaitForGalleryGate((id) => {
        seedTwoCandidates(id);
        writeCandidateManifest(id, 'candidate-c', {
          captured_at: '2026-09-25T07:00:00Z',
          exit_status: { status: 'failed', reason: 'render timed out' },
        });
      });
      render(GalleryGate, { props: { runId } });

      const reason = await screen.findByText('render timed out', {}, { timeout: 5000 });
      const card = reason.closest('.candidate-card');
      expect(card?.textContent).toContain('candidate-c');
      expect(card?.textContent).not.toContain('2026-09-25');
    }, 20000);
  });

  describe('poll failure toasts', () => {
    // Live toasts only: a toast dismissed earlier can briefly re-render,
    // marked data-removed, because sonner's store is global.
    const toasts = () =>
      document.querySelectorAll('[data-sonner-toast][data-removed="false"]');

    // Close every toast while this test's <Toaster> is still mounted so
    // none carries over into the next test.
    afterEach(async () => {
      toast.dismiss();
      await waitFor(() => expect(toasts().length).toBe(0));
    });

    it('toasts a failing poll once, not on every tick', async () => {
      render(Toaster);
      render(GalleryGate, { props: { runId: 'no-such-run' } });

      expect(
        await screen.findByText('not found: run no-such-run', {}, { timeout: 5000 })
      ).toBeTruthy();
      // Watch three more failing 2s ticks. The toast closes itself after
      // sonner's 4s default, and none of the later failures brings it back.
      let most = 0;
      for (let waited = 0; waited < 6500; waited += 100) {
        most = Math.max(most, toasts().length);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      expect(most).toBe(1);
      expect(toasts().length).toBe(0);
    }, 15000);

    it('shows no toast for a real run that has no gallery gate', async () => {
      // Parks on a plain interviewer gate, so the poll succeeds with no gallery gate.
      const { run_id: runId } = await runsApi.submitRun({
        dot_source: `digraph GalleryGateNoGate {
          start [shape=circle];
          gate [shape=oval, label="Proceed?"];
          done [shape=doublecircle];
          start -> gate -> done;
        }`,
        variables: {},
      });
      render(Toaster);
      render(GalleryGate, { props: { runId } });

      // The first poll plus two 2s ticks.
      await new Promise((resolve) => setTimeout(resolve, 4500));

      expect(toasts().length).toBe(0);
    }, 15000);
  });
});
