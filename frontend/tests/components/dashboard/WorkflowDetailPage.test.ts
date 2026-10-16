// ABOUTME: Tests for WorkflowDetailPage, the /workflows/{id} page, rendered under the real toolbar
// ABOUTME: Stand-in libraries for the frame's states; throwaway run_launch_check.dot imports for real runs

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/svelte/svelte5';
import WorkflowDetailHost from './WorkflowDetailHost.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as workflowsApi from '../../../src/lib/api/workflows';
import type { WorkflowSummary } from '../../../src/lib/api/workflows';
import * as runsApi from '../../../src/lib/api/runs';
import type { RunSummary } from '../../../src/lib/api/runs';
import { isNeedsYou } from '../../../src/lib/runStatus';
import { formatWorkflowName } from '../../../src/lib/utils';
import { createLibraryStore } from '../../../src/stores/library.svelte';
import { ANONYMOUS_GATE, submitGraph, cancelAll } from '../../fixtures/graphs';

const runLaunchCheck = readFileSync(
  join(process.cwd(), '..', 'examples', 'run_launch_check.dot'),
  'utf-8'
);

// An uppercase letter and a dot, which the edit route's id pattern misses.
async function importThrowaway(): Promise<{ id: string; name: string }> {
  const name = `_test_Detail.v1_${Date.now()}`;
  const { id } = await workflowsApi.importWorkflowDot(name, runLaunchCheck);
  return { id, name };
}

const WORKFLOW: WorkflowSummary = {
  id: 'examples__design_concepts_review',
  name: 'design_concepts_review.dot',
  source_dir: 'workflows/design',
  path: 'workflows/design/design_concepts_review.dot',
};

function fakeLibrary(state: {
  workflows?: WorkflowSummary[];
  runs?: RunSummary[];
  loaded?: boolean;
  error?: string | null;
  refresh?: () => Promise<void>;
}) {
  const runs = state.runs ?? [];
  return {
    workflows: state.workflows ?? [WORKFLOW],
    runs,
    needsYou: runs.filter(isNeedsYou),
    loaded: state.loaded ?? true,
    error: state.error ?? null,
    refresh: state.refresh ?? (async () => {}),
  };
}

function toolbar() {
  return screen.getByRole('banner');
}

let launched: string[] = [];
let stores: { stop(): void }[] = [];

// A real library store against the test backend, as AppShell starts it.
async function realLibrary(pollMs = 5000) {
  const library = createLibraryStore(pollMs);
  library.start();
  stores.push(library);
  await waitFor(() => expect(library.loaded).toBe(true), { timeout: 5000 });
  return library;
}

describe('WorkflowDetailPage', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    stores.forEach((s) => s.stop());
    stores = [];
    // bits-ui's scroll lock clears this on a timer after the open dialog
    // unmounts; reset it so the next test's clicks aren't blocked.
    document.body.style.pointerEvents = '';
    await Promise.all(launched.map((id) => runsApi.cancelRun(id).catch(() => undefined)));
    launched = [];
    await cancelAll();
    const { workflows } = await workflowsApi.listWorkflows();
    for (const w of workflows) {
      if (w.name.startsWith('_test_Detail.')) rmSync(w.path, { force: true });
    }
  });

  describe('toolbar', () => {
    it('shows the title, the file name and folder, Back to Workflows, Edit Workflow and Run', () => {
      render(WorkflowDetailHost, { props: { workflowId: WORKFLOW.id, library: fakeLibrary({}) } });

      expect(within(toolbar()).getByRole('heading', { level: 1, name: 'Design Concepts Review' })).toBeTruthy();
      expect(within(toolbar()).getByTestId('toolbar-subtitle').textContent).toBe(
        'design_concepts_review.dot · workflows/design'
      );
      expect(within(toolbar()).getByTestId('toolbar-subtitle').querySelector('code')?.textContent).toBe(
        'design_concepts_review.dot'
      );
      expect(within(toolbar()).getByRole('link', { name: 'Back to Workflows' })).toHaveAttribute('href', '/');
      expect(within(toolbar()).getByRole('link', { name: 'Edit Workflow' })).toHaveAttribute(
        'href',
        `/workflows/${encodeURIComponent(WORKFLOW.id)}/edit`
      );
      expect(within(toolbar()).getByRole('button', { name: 'Run' })).toBeTruthy();
    });

    it('reads "Workflow" with no subtitle or actions while the library loads', () => {
      render(WorkflowDetailHost, {
        props: { workflowId: WORKFLOW.id, library: fakeLibrary({ workflows: [], loaded: false }) },
      });

      expect(within(toolbar()).getByRole('heading', { level: 1, name: 'Workflow' })).toBeTruthy();
      expect(within(toolbar()).queryByTestId('toolbar-subtitle')).toBeNull();
      expect(within(toolbar()).queryByRole('button', { name: 'Run' })).toBeNull();
      expect(within(toolbar()).queryByRole('link', { name: 'Edit Workflow' })).toBeNull();
    });

    it('makes no workflow or run requests of its own', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      render(WorkflowDetailHost, { props: { workflowId: WORKFLOW.id, library: fakeLibrary({}) } });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const urls = fetchSpy.mock.calls.map(([input]) => String(input instanceof Request ? input.url : input));
      expect(urls.filter((u) => /\/api\/(runs|workflows)$/.test(u))).toEqual([]);
    });
  });

  describe('not found and errors', () => {
    it('says so when no workflow has the id, with only the back button in the toolbar', () => {
      render(WorkflowDetailHost, { props: { workflowId: 'no-such-workflow', library: fakeLibrary({}) } });

      expect(within(toolbar()).getByRole('heading', { level: 1, name: 'Workflow not found' })).toBeTruthy();
      expect(screen.getByText("We couldn't find that workflow. It may have been renamed or moved.")).toBeTruthy();
      const main = screen.getByText(/couldn't find that workflow/).closest('div')!;
      expect(within(main).getByRole('link', { name: 'Back to Workflows' })).toHaveAttribute('href', '/');
      expect(within(toolbar()).queryByRole('button', { name: 'Run' })).toBeNull();
      expect(within(toolbar()).queryByRole('link', { name: 'Edit Workflow' })).toBeNull();
      expect(within(toolbar()).queryByTestId('toolbar-subtitle')).toBeNull();
    });

    it('shows a failed library load with Try Again', async () => {
      const refresh = vi.fn(async () => {});
      render(WorkflowDetailHost, {
        props: {
          workflowId: WORKFLOW.id,
          library: fakeLibrary({ workflows: [], loaded: false, error: 'Network down', refresh }),
        },
      });

      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Network down');
      await fireEvent.click(within(alert).getByRole('button', { name: 'Try Again' }));
      expect(refresh).toHaveBeenCalledOnce();
    });
  });

  describe('with the real backend', () => {
    it('shows an imported workflow in the toolbar', async () => {
      const { id, name } = await importThrowaway();
      const library = await realLibrary();

      render(WorkflowDetailHost, { props: { workflowId: id, library } });

      expect(
        within(toolbar()).getByRole('heading', { level: 1, name: formatWorkflowName(`${name}.dot`).trim() })
      ).toBeTruthy();
      expect(within(toolbar()).getByTestId('toolbar-subtitle').textContent).toMatch(
        new RegExp(`^${name.replace(/\./g, '\\.')}\\.dot · /`)
      );
    });

    it('lists what the workflow does, in running order with plain kinds', async () => {
      const { id } = await importThrowaway();
      const library = await realLibrary();

      render(WorkflowDetailHost, { props: { workflowId: id, library } });

      const steps = screen.getByRole('region', { name: 'What it does' });
      const list = await within(steps).findByRole('list', {}, { timeout: 5000 });
      expect(within(steps).getByText('The steps in order.')).toBeTruthy();
      expect(within(list).getAllByRole('listitem').map((li) => li.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
        '1 Start Start',
        '2 Brief: {{brief}} | Model: {{model}} | Colour: {{colour}} Ask a person',
        '3 Exit Finish',
      ]);
    });

    it("shows a failed graph read with Try Again", async () => {
      render(WorkflowDetailHost, { props: { workflowId: WORKFLOW.id, library: fakeLibrary({}) } });

      const steps = screen.getByRole('region', { name: 'What it does' });
      const alert = await within(steps).findByRole('alert', {}, { timeout: 5000 });
      expect(alert.textContent).toContain("Couldn't read this workflow's steps.");
      expect(within(alert).getByRole('button', { name: 'Try Again' })).toBeTruthy();
    });

    it('opens the run dialog from Run, and Cancel launches nothing', async () => {
      const { id } = await importThrowaway();
      const library = await realLibrary();
      render(WorkflowDetailHost, { props: { workflowId: id, library } });

      await fireEvent.click(within(toolbar()).getByRole('button', { name: 'Run' }));
      const dialog = await screen.findByRole('dialog', {}, { timeout: 5000 });
      expect(within(dialog).getByRole('heading', { name: /^Run / })).toBeTruthy();
      await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      const { runs } = await runsApi.listRuns();
      expect(runs.filter((r) => r.workflow_id === id)).toEqual([]);
    });

    it('shows no banner and "No runs yet." for a fresh workflow', async () => {
      const { id } = await importThrowaway();
      const library = await realLibrary();

      render(WorkflowDetailHost, { props: { workflowId: id, library } });

      expect(await screen.findByText('No runs yet.', {}, { timeout: 5000 })).toBeTruthy();
      expect(screen.queryByRole('region', { name: 'Active run' })).toBeNull();
    });

    it('features the newest running run, lists only its own runs, and drops the banner once done', async () => {
      const { id } = await importThrowaway();
      const older = (await runsApi.runWorkflow(id)).run_id;
      launched.push(older);
      const newer = (await runsApi.runWorkflow(id)).run_id;
      launched.push(newer);
      // Another graph's run, which must never appear on this page.
      const other = await submitGraph(ANONYMOUS_GATE);
      const library = await realLibrary(500);

      render(WorkflowDetailHost, { props: { workflowId: id, library } });

      const banner = await screen.findByRole('region', { name: 'Active run' }, { timeout: 5000 });
      expect(within(banner).getByRole('link', { name: newer })).toHaveAttribute('href', `/runs/${newer}`);
      expect(within(banner).getByText('+ 1 more running')).toBeTruthy();
      // Paused at names the gate step by its label from the graph.
      await waitFor(
        () => expect(within(banner).getByText(/^Brief: .* \| Colour: /, { selector: 'strong' })).toBeTruthy(),
        { timeout: 5000 }
      );
      expect(within(banner).getByRole('link', { name: 'Answer' })).toHaveAttribute('href', `/runs/${newer}`);

      const history = screen.getByRole('region', { name: 'Run History' });
      const rows = within(history).getAllByRole('row').slice(1);
      expect(rows).toHaveLength(2);
      expect(within(history).getByRole('link', { name: newer })).toBeTruthy();
      expect(within(history).getByRole('link', { name: older })).toBeTruthy();
      expect(screen.queryByRole('link', { name: other })).toBeNull();

      await runsApi.cancelRun(older);
      await runsApi.cancelRun(newer);

      await waitFor(() => expect(screen.queryByRole('region', { name: 'Active run' })).toBeNull(), {
        timeout: 8000,
      });
      expect(screen.queryByRole('region', { name: 'Latest run' })).toBeNull();
    }, 20000);
  });
});
