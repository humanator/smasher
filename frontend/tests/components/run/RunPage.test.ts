// ABOUTME: Tests for RunPage, the /runs/{id} page, rendered under the real toolbar against the test backend
// ABOUTME: Real runs that cost nothing: instant finish, a sleeping command, a failing tool and a parked gate

import type { ComponentProps } from 'svelte';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { rmSync } from 'fs';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import RunPageHost from './RunPageHost.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import * as workflowsApi from '../../../src/lib/api/workflows';
import { createLibraryStore } from '../../../src/stores/library.svelte';
import {
  ANONYMOUS_GATE,
  FAIL_TOOL,
  GALLERY_GATE_APPROVE,
  GALLERY_GATE_THREE_EDGES,
  QUICK_FINISH,
  RUN_FAIL_CHECK,
  SLEEPING,
  cancelAll,
  submitGraph,
  trackRun,
} from '../../fixtures/graphs';

// Matches smasher-web's default_data_dir(): $SMASHER_DATA_DIR, else ~/Documents/smasher.
const artifactsRoot = join(process.env.SMASHER_DATA_DIR ?? join(homedir(), 'Documents', 'smasher'), 'artifacts');

function writeCandidate(runId: string, candidateId: string, exitStatus: Record<string, unknown> = { status: 'success' }) {
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

// A run parked on a gallery gate with candidates a and b (and a failed c, when asked), shown by the page.
async function galleryRun(dot = GALLERY_GATE_APPROVE, withFailed = false) {
  const id = await submitGraph(dot);
  writeCandidate(id, 'candidate-a');
  writeCandidate(id, 'candidate-b');
  if (withFailed) writeCandidate(id, 'candidate-c', { status: 'failed', reason: 'render timed out' });
  await renderRun(id);
  return id;
}

const NO_WORKFLOWS = { workflows: [], loaded: true };

// Runs are real; a loaded machine can take a few seconds to reach a state.
const SLOW = { timeout: 8000 };

const toolbar = () => screen.getByRole('banner');
const hero = () => screen.getByTestId('run-hero');

function renderRun(
  runId: string,
  library: ComponentProps<typeof RunPageHost>['library'] = NO_WORKFLOWS,
  navigate?: (url: string) => void
) {
  return render(RunPageHost, { props: { runId, library, navigate } });
}

let stores: { stop(): void }[] = [];

describe('RunPage', { timeout: 20_000 }, () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    stores.forEach((s) => s.stop());
    stores = [];
    document.body.style.pointerEvents = '';
    await cancelAll();
    const { workflows } = await workflowsApi.listWorkflows();
    for (const w of workflows) {
      if (w.name.startsWith('_test_RunPage.')) rmSync(w.path, { force: true });
    }
  });

  describe('loading and not found', () => {
    it('reads "Run" with no badge or actions while the run loads', async () => {
      const id = await submitGraph(QUICK_FINISH);
      await renderRun(id);

      expect(within(toolbar()).getByRole('heading', { level: 1, name: 'Run' })).toBeTruthy();
      expect(within(toolbar()).queryByTestId('toolbar-subtitle')).toBeNull();
      expect(within(toolbar()).queryByRole('button')).toBeNull();
      expect(screen.getByRole('status', { name: 'Loading run' })).toBeTruthy();
      await waitFor(() => expect(screen.queryByRole('status', { name: 'Loading run' })).toBeNull());
    });

    it('says so, with a link to Workflows, when the run is unknown', async () => {
      await renderRun('no-such-run');

      await waitFor(() =>
        expect(within(toolbar()).getByRole('heading', { level: 1, name: 'Run not found' })).toBeTruthy()
      );
      expect(screen.getByText(/couldn't find that run/i)).toBeTruthy();
      // The toolbar's back button and the page's own link.
      const links = screen.getAllByRole('link', { name: 'Back to Workflows' });
      expect(links).toHaveLength(2);
      links.forEach((link) => expect(link).toHaveAttribute('href', '/'));
      expect(within(toolbar()).queryByRole('button')).toBeNull();
    });
  });

  describe('a running run', () => {
    it('shows the badge, subtitle, Abort Run and the Now running hero', async () => {
      const id = await submitGraph(SLEEPING);
      await renderRun(id);

      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'running'), SLOW);
      expect(hero()).toHaveAttribute('aria-live', 'polite');
      expect(within(hero()).getByText('Now running')).toBeTruthy();

      expect(within(toolbar()).getByRole('heading', { level: 1, name: 'Sleeping' })).toBeTruthy();
      expect(within(toolbar()).getByText('Running')).toBeTruthy();
      const subtitle = within(toolbar()).getByTestId('toolbar-subtitle');
      expect(subtitle.querySelector('code')?.textContent).toBe(id);
      expect(subtitle.textContent).toMatch(/Started .* · .* so far$/);
      expect(within(toolbar()).getByRole('link', { name: 'Back to Workflows' })).toHaveAttribute('href', '/');
      expect(within(toolbar()).getByRole('button', { name: 'Abort Run' })).toBeTruthy();
      expect(within(toolbar()).queryByRole('button', { name: 'Run Again' })).toBeNull();
    });

    // The step name comes from the run's events over SSE, which has no reconnect, so a dropped
    // connection is retried rather than failing the suite.
    it('names the step that is running', { timeout: 20_000, retry: 2 }, async () => {
      const id = await submitGraph(SLEEPING);
      await renderRun(id);
      await waitFor(() => expect(within(hero()).getByRole('heading', { level: 2, name: 'Take a nap' })).toBeTruthy(), {
        timeout: 10_000,
      });
      expect(within(hero()).getByText(/Runs a built-in check or a command/)).toBeTruthy();
    });

    it('aborts the run and then shows it as stopped, with no Abort Run', async () => {
      const id = await submitGraph(SLEEPING);
      await renderRun(id);
      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'running'), SLOW);

      await fireEvent.click(within(toolbar()).getByRole('button', { name: 'Abort Run' }));

      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'aborted'), SLOW);
      expect(within(hero()).getByRole('heading', { level: 2, name: 'Stopped by you' })).toBeTruthy();
      expect(within(toolbar()).getByText('Aborted')).toBeTruthy();
      expect(within(toolbar()).queryByRole('button', { name: 'Abort Run' })).toBeNull();
      await waitFor(async () => expect((await runsApi.getRun(id)).status).toBe('Aborted'));
      // An ad-hoc run has no workflow to run again.
      expect(screen.queryByRole('button', { name: 'Run Again' })).toBeNull();
    });
  });

  describe('a run that needs you', () => {
    it('shows the Needs you badge and the gate under its eyebrow', async () => {
      const id = await submitGraph(ANONYMOUS_GATE);
      await renderRun(id);

      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'waiting'), SLOW);
      expect(within(toolbar()).getByText('Needs you')).toBeTruthy();
      expect(within(hero()).getByText(/· Ask a person$/)).toBeTruthy();
      expect(hero()).not.toHaveAttribute('aria-live');
      expect(within(toolbar()).getByRole('button', { name: 'Abort Run' })).toBeTruthy();
    });
  });

  describe('a completed run', () => {
    it('shows the Finished hero and a toolbar with no Abort Run (ad hoc: no Run Again)', async () => {
      const id = await submitGraph(QUICK_FINISH);
      await renderRun(id);

      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'completed'), SLOW);
      expect(within(hero()).getByRole('heading', { level: 2, name: /^Finished in / })).toBeTruthy();
      expect(within(hero()).getByText('All 2 steps ran to the end.')).toBeTruthy();
      expect(hero()).not.toHaveAttribute('aria-live');
      expect(within(toolbar()).getByText('Completed')).toBeTruthy();
      expect(within(toolbar()).getByTestId('toolbar-subtitle').textContent).not.toContain('so far');
      expect(within(toolbar()).queryByRole('button', { name: 'Abort Run' })).toBeNull();
      expect(within(toolbar()).queryByRole('button', { name: 'Run Again' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Show Results in Finder' })).toBeNull();
    });
  });

  describe('a failed run', () => {
    it('names the step, shows the message and what to try, but no editor link for an ad-hoc run', async () => {
      const id = await submitGraph(RUN_FAIL_CHECK);
      await renderRun(id);

      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'failed'), SLOW);
      expect(hero()).toHaveAttribute('role', 'alert');
      expect(within(hero()).getByRole('heading', { level: 2, name: "bad couldn't finish" })).toBeTruthy();
      expect(within(hero()).getByText(/invalid json in args attribute/i)).toBeTruthy();
      expect(within(hero()).getByRole('heading', { level: 3, name: 'What you can try' })).toBeTruthy();
      expect(within(hero()).getByText(/check this step's settings/i)).toBeTruthy();
      expect(within(toolbar()).getByText('Failed')).toBeTruthy();
      expect(screen.queryByRole('link', { name: 'Open in Editor' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Run Again' })).toBeNull();
    });

    it('for a workflow run links back to the workflow, offers Open in Editor and opens the Run dialog', async () => {
      const name = `_test_RunPage.v1_${Date.now()}`;
      const { id: workflowId } = await workflowsApi.importWorkflowDot(name, RUN_FAIL_CHECK);
      const { run_id } = await runsApi.runWorkflow(workflowId);
      trackRun(run_id);
      const library = createLibraryStore(5000);
      library.start();
      stores.push(library);
      await waitFor(() => expect(library.loaded).toBe(true), { timeout: 5000 });
      await renderRun(run_id, library);

      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'failed'), SLOW);
      const title = within(toolbar()).getByRole('heading', { level: 1 }).textContent ?.trim() ?? '';
      expect(title).toContain('RunPage');
      expect(within(toolbar()).getByRole('link', { name: `Back to ${title}` })).toHaveAttribute(
        'href',
        `/workflows/${encodeURIComponent(workflowId)}`
      );
      expect(within(hero()).getByRole('link', { name: 'Open in Editor' })).toHaveAttribute(
        'href',
        `/workflows/${encodeURIComponent(workflowId)}/edit`
      );
      expect(within(hero()).getByRole('button', { name: 'Run Again' })).toBeTruthy();

      await fireEvent.click(within(toolbar()).getByRole('button', { name: 'Run Again' }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    });
  });

  describe('resuming', () => {
    async function failedWorkflowRun() {
      const name = `_test_RunPage.resume_${Date.now()}`;
      const { id: workflowId } = await workflowsApi.importWorkflowDot(name, FAIL_TOOL);
      const { run_id } = await runsApi.runWorkflow(workflowId);
      trackRun(run_id);
      const library = createLibraryStore(5000);
      library.start();
      stores.push(library);
      await waitFor(() => expect(library.loaded).toBe(true), { timeout: 5000 });
      return { workflowId, run_id, library };
    }

    it('offers Resume from the failed step in hero and toolbar, with Run Again as outline', async () => {
      const { run_id, library } = await failedWorkflowRun();
      await renderRun(run_id, library);

      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'failed'), SLOW);
      const resume = await within(hero()).findByRole('button', { name: 'Resume from work' });
      expect(resume.className).toContain('bg-primary');
      expect(within(hero()).getByRole('button', { name: 'Run Again' }).className).toContain('bg-control');
      expect(within(toolbar()).getByRole('button', { name: 'Resume' })).toBeTruthy();
      expect(within(toolbar()).getByRole('button', { name: 'Run Again' })).toBeTruthy();
    });

    it('posts the resume and opens the new run, which belongs to the same workflow', async () => {
      const { workflowId, run_id, library } = await failedWorkflowRun();
      const navigate = vi.fn();
      await renderRun(run_id, library, navigate);
      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'failed'), SLOW);

      await fireEvent.click(await within(hero()).findByRole('button', { name: 'Resume from work' }));

      await waitFor(() => expect(navigate).toHaveBeenCalledOnce(), SLOW);
      const [url] = navigate.mock.calls[0] as [string];
      const newId = trackRun(url.replace('/runs/', ''));
      expect(url).toBe(`/runs/${newId}`);
      expect(newId).not.toBe(run_id);
      expect((await runsApi.getRun(newId)).workflow_id).toBe(workflowId);
    });

    it('shows Resuming… in hero and toolbar until the server answers', async () => {
      const { run_id, library } = await failedWorkflowRun();
      const navigate = vi.fn();
      await renderRun(run_id, library, navigate);
      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'failed'), SLOW);
      const button = await within(hero()).findByRole('button', { name: 'Resume from work' });

      // Hold the real request back so the in-flight state can be seen.
      const real = globalThis.fetch;
      let release = () => {};
      const gate = new Promise<void>((resolve) => (release = resolve));
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        if (String(input).endsWith('/resume')) await gate;
        return real(input, init);
      });
      await fireEvent.click(button);

      expect((await within(hero()).findByRole('button', { name: 'Resuming…' })) as HTMLButtonElement).toBeDisabled();
      expect(within(toolbar()).getByRole('button', { name: 'Resuming…' })).toBeDisabled();
      release();
      await waitFor(() => expect(navigate).toHaveBeenCalledOnce(), SLOW);
      trackRun((navigate.mock.calls[0] as [string])[0].replace('/runs/', ''));
    });

    it('says so inline when the server refuses, and leaves the page usable', async () => {
      const { run_id, library } = await failedWorkflowRun();
      const navigate = vi.fn();
      await renderRun(run_id, library, navigate);
      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'failed'), SLOW);
      await within(hero()).findByRole('button', { name: 'Resume from work' });

      const real = globalThis.fetch;
      vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) =>
        String(input).endsWith('/resume')
          ? Promise.resolve(new Response(JSON.stringify({ error: 'no checkpoint' }), { status: 500 }))
          : real(input, init)
      );
      await fireEvent.click(within(hero()).getByRole('button', { name: 'Resume from work' }));

      const alert = await screen.findByText(/Couldn't resume the run/);
      expect(alert.getAttribute('role')).toBe('alert');
      expect(navigate).not.toHaveBeenCalled();
      expect(within(hero()).getByRole('button', { name: 'Resume from work' })).not.toBeDisabled();
      expect(within(hero()).getByRole('button', { name: 'Run Again' })).not.toBeDisabled();
    });

    it('offers nothing on a run that finished', async () => {
      const id = await submitGraph(QUICK_FINISH);
      await renderRun(id);
      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'completed'), SLOW);
      expect(screen.queryByRole('button', { name: /^Resume/ })).toBeNull();
    });

    it('offers Resume alone on an ad-hoc run, which has no workflow to run again', async () => {
      const id = await submitGraph(FAIL_TOOL);
      await renderRun(id);
      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'failed'), SLOW);
      await within(hero()).findByRole('button', { name: 'Resume from work' });
      expect(screen.queryByRole('button', { name: 'Run Again' })).toBeNull();
    });
  });

  describe('an aborted run', () => {
    it('shows it as stopped', async () => {
      const id = await submitGraph(ANONYMOUS_GATE);
      await runsApi.cancelRun(id);
      await renderRun(id);

      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'aborted'), SLOW);
      expect(within(hero()).getByRole('heading', { level: 2, name: 'Stopped by you' })).toBeTruthy();
      expect(within(toolbar()).getByText('Aborted')).toBeTruthy();
      expect(screen.queryByText('What you can try')).toBeNull();
    });
  });

  describe('the Run information toggle', () => {
    it('is a pressed/expanded toggle', async () => {
      const id = await submitGraph(QUICK_FINISH);
      await renderRun(id);
      const toggle = await within(toolbar()).findByRole('button', { name: 'Run information' });
      const before = toggle.getAttribute('aria-pressed');

      await fireEvent.click(toggle);

      expect(toggle.getAttribute('aria-pressed')).toBe(before === 'true' ? 'false' : 'true');
      expect(toggle.getAttribute('aria-expanded')).toBe(toggle.getAttribute('aria-pressed'));
    });
  });

  describe('a run at a gallery gate', () => {
    const decisionBar = () => screen.getByRole('region', { name: 'Decision' });
    const select = (id: string) => screen.findByRole('button', { name: `Select ${id}` }, SLOW);

    it('shows the candidates and the Decision bar under the hero, with Approve off until something is selected', async () => {
      await galleryRun();

      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'waiting'), SLOW);
      expect(await screen.findByText('Expected 2, found 2', {}, SLOW)).toBeTruthy();
      expect(screen.getByRole('heading', { level: 2, name: 'Candidates' })).toBeTruthy();
      expect(within(decisionBar()).getByText('Nothing selected yet. Select the candidates you want to keep.')).toBeTruthy();
      expect((within(decisionBar()).getByRole('button', { name: 'Approve Selected' }) as HTMLButtonElement).disabled).toBe(true);
      expect(screen.queryByRole('heading', { name: 'Your decisions' })).toBeNull();
    });

    it('selects, notes and approves: the bar goes, the run finishes, the decision is recorded and the candidate is Chosen', async () => {
      const user = userEvent.setup();
      const id = await galleryRun();

      await user.click(await select('candidate-b'));
      expect(within(decisionBar()).getByText('1 selected: candidate-b')).toBeTruthy();
      await user.click(screen.getAllByRole('button', { name: 'Add a Note…' })[1]);
      await user.type(screen.getByLabelText('Note for candidate-b'), '  keep the header  ');
      await user.click(within(decisionBar()).getByRole('button', { name: 'Approve Selected' }));

      await waitFor(() => expect(screen.queryByRole('region', { name: 'Decision' })).toBeNull(), SLOW);
      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'completed'), SLOW);
      expect(await within(hero()).findByText(/You approved candidate-b/, {}, SLOW)).toBeTruthy();
      const { decisions } = await runsApi.listDecisions(id);
      expect(decisions[0]).toMatchObject({
        decision: 'approve',
        selected: ['candidate-b'],
        comments: { 'candidate-b': 'keep the header' },
      });
      // The candidates stay, now without Select, and the decision is listed.
      const chosen = await screen.findByText('Chosen', {}, SLOW);
      expect(chosen.closest('.candidate-card')?.textContent).toContain('candidate-b');
      expect(screen.queryByRole('button', { name: /^Select/ })).toBeNull();
      const card = await screen.findByRole('listitem', {}, SLOW);
      expect(within(card).getByRole('heading', { level: 3, name: 'Pick a favourite' })).toBeTruthy();
      expect(within(card).getByText('Approved')).toBeTruthy();
    });

    it('shows a failure inline in the bar and leaves the gate open to try again', async () => {
      const user = userEvent.setup();
      await galleryRun();

      await user.click(await select('candidate-a'));
      await user.click(screen.getAllByRole('button', { name: 'Add a Note…' })[0]);
      await fireEvent.input(screen.getByLabelText('Note for candidate-a'), { target: { value: 'x'.repeat(4001) } });
      await user.click(within(decisionBar()).getByRole('button', { name: 'Approve Selected' }));

      expect((await within(decisionBar()).findByRole('alert', {}, SLOW)).textContent).toMatch(/exceeds 4000 characters/i);
      expect((within(decisionBar()).getByRole('button', { name: 'Approve Selected' }) as HTMLButtonElement).disabled).toBe(false);
    });

    it('sends Try Again with My Notes back with nothing selected, and records Sent back', async () => {
      const user = userEvent.setup();
      const id = await galleryRun();
      await select('candidate-a');

      await user.click(within(decisionBar()).getByRole('button', { name: 'Try Again with My Notes' }));

      await waitFor(async () => expect((await runsApi.listDecisions(id)).decisions).toHaveLength(1), SLOW);
      expect((await runsApi.listDecisions(id)).decisions[0]).toMatchObject({ decision: 'iterate', selected: [] });
    });

    it('shows an extra button for a third edge, which needs no selection and is submitted as that edge', async () => {
      const user = userEvent.setup();
      const id = await galleryRun(GALLERY_GATE_THREE_EDGES);
      await select('candidate-a');

      const bar = decisionBar();
      expect(within(bar).getByRole('button', { name: 'Try Again with My Notes' })).toBeTruthy();
      expect(within(bar).getByRole('button', { name: 'Approve Selected' })).toBeTruthy();
      const skip = within(bar).getByRole('button', { name: 'Skip' });
      expect((skip as HTMLButtonElement).disabled).toBe(false);
      await user.click(skip);

      await waitFor(async () => expect((await runsApi.listDecisions(id)).decisions).toHaveLength(1), SLOW);
      expect((await runsApi.listDecisions(id)).decisions[0]).toMatchObject({ decision: 'skip', selected: [] });
      // An unknown decision shows as the gate named it.
      expect(await screen.findByText('skip', {}, SLOW)).toBeTruthy();
    });

    it('lists a candidate that could not be rendered as a tile, not a card', async () => {
      await galleryRun(GALLERY_GATE_APPROVE, true);

      expect(await screen.findByText('render timed out', {}, SLOW)).toBeTruthy();
      expect(screen.getByText('Expected 2, found 3 · 1 could not be rendered')).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Select candidate-c' })).toBeNull();
    });
  });

  describe('candidates after the run', () => {
    it('still shows a finished run\'s candidates, with nothing to select or decide', async () => {
      const id = await submitGraph(QUICK_FINISH);
      writeCandidate(id, 'candidate-a');
      await renderRun(id);

      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'completed'), SLOW);
      expect(await screen.findByRole('heading', { level: 2, name: 'Candidates' }, SLOW)).toBeTruthy();
      expect(screen.getByText('candidate-a')).toBeTruthy();
      expect(screen.queryByRole('button', { name: /^Select/ })).toBeNull();
      expect(screen.queryByRole('region', { name: 'Decision' })).toBeNull();
    });

    it('shows no Candidates, Decision bar or decisions for a run with none', async () => {
      const id = await submitGraph(ANONYMOUS_GATE);
      await renderRun(id);

      await waitFor(() => expect(hero()).toHaveAttribute('data-state', 'waiting'), SLOW);
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(screen.queryByRole('heading', { name: 'Candidates' })).toBeNull();
      expect(screen.queryByRole('region', { name: 'Decision' })).toBeNull();
      expect(screen.queryByRole('heading', { name: 'Your decisions' })).toBeNull();
    });
  });
});
