// ABOUTME: Tests for RunPage, the /runs/{id} page, rendered under the real toolbar against the test backend
// ABOUTME: Real runs that cost nothing: instant finish, a sleeping command, a failing tool and a parked gate

import type { ComponentProps } from 'svelte';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { rmSync } from 'fs';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/svelte/svelte5';
import RunPageHost from './RunPageHost.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import * as workflowsApi from '../../../src/lib/api/workflows';
import { createLibraryStore } from '../../../src/stores/library.svelte';
import {
  ANONYMOUS_GATE,
  QUICK_FINISH,
  RUN_FAIL_CHECK,
  SLEEPING,
  cancelAll,
  submitGraph,
  trackRun,
} from '../../fixtures/graphs';

const NO_WORKFLOWS = { workflows: [], loaded: true };

// Runs are real; a loaded machine can take a few seconds to reach a state.
const SLOW = { timeout: 8000 };

const toolbar = () => screen.getByRole('banner');
const hero = () => screen.getByTestId('run-hero');

function renderRun(runId: string, library: ComponentProps<typeof RunPageHost>['library'] = NO_WORKFLOWS) {
  return render(RunPageHost, { props: { runId, library } });
}

let stores: { stop(): void }[] = [];

describe('RunPage', { timeout: 20_000 }, () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
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
});
