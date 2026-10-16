// ABOUTME: Tests for DashboardPage, the home page: toolbar controls, the workflows table, Run… and import
// ABOUTME: Runs against the real backend; ported from the WorkflowCatalog tests it replaces

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { render, screen, waitFor, within } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../../../src/components/dashboard/DashboardPage.svelte';
import { createLibraryStore } from '../../../src/stores/library.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as workflowsApi from '../../../src/lib/api/workflows';
import * as runsApi from '../../../src/lib/api/runs';

const API_URL = 'http://127.0.0.1:21541/api';

let libraries: ReturnType<typeof createLibraryStore>[] = [];

function renderPage() {
  const library = createLibraryStore();
  libraries.push(library);
  library.start();
  render(DashboardPage, { props: { library } });
  return library;
}

async function rowFor(fileName: string): Promise<HTMLElement> {
  const name = await screen.findByText(fileName, {}, { timeout: 5000 });
  return name.closest('[role="row"]') as HTMLElement;
}

describe('DashboardPage', () => {
  beforeAll(() => {
    setApiBaseUrl(API_URL);
  });

  afterEach(() => {
    libraries.splice(0).forEach((l) => l.stop());
    libraries = [];
    // bits-ui's scroll lock clears this on a timer after an open dialog
    // unmounts; reset it so the next test's clicks aren't blocked.
    document.body.style.pointerEvents = '';
  });

  it('shows the loading skeleton until the library loads', () => {
    renderPage();
    expect(screen.getByRole('table', { name: 'All workflows' }).getAttribute('aria-busy')).toBe('true');
  });

  it('renders the real workflow list from GET /api/workflows', async () => {
    renderPage();

    // examples/human_gate_showcase.dot is a real fixture in the workflow dir
    // the dev:backend server is configured against.
    const table = screen.getByRole('table', { name: 'All workflows' });
    expect(await within(table).findByText('Human Gate Showcase', {}, { timeout: 5000 })).toBeTruthy();
  });

  it("links each workflow's name to its page", async () => {
    const { workflows } = await workflowsApi.listWorkflows();
    const showcase = workflows.find((w) => w.name === 'human_gate_showcase.dot')!;
    renderPage();

    const link = await screen.findByRole('link', { name: 'Human Gate Showcase' }, { timeout: 5000 });
    expect(link).toHaveAttribute('href', `/workflows/${encodeURIComponent(showcase.id)}`);
  });

  describe('toolbar controls', () => {
    it('has the search field and three named icon controls', () => {
      renderPage();

      const search = screen.getByRole('searchbox', { name: 'Search workflows' });
      expect(search).toHaveAttribute('placeholder', 'Search');
      expect(screen.getByRole('button', { name: 'Import .dot file' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'AI model settings' })).toBeTruthy();
      expect(screen.getByRole('link', { name: 'New workflow' })).toHaveAttribute('href', '/workflows/new');
    });

    it('filters the workflows table as you type', async () => {
      const user = userEvent.setup();
      renderPage();
      await within(screen.getByRole('table', { name: 'All workflows' })).findByText('Human Gate Showcase', {}, { timeout: 5000 });

      await user.type(screen.getByRole('searchbox', { name: 'Search workflows' }), 'HUMAN_GATE_SHOW');

      const table = screen.getByRole('table', { name: 'All workflows' });
      const rows = within(table).getAllByRole('row').slice(1);
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) expect(row.textContent?.toLowerCase()).toContain('human_gate_show');
    });

    it('opens Settings from the settings button', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: 'AI model settings' }));

      // Settings loads as its own chunk on first open; compiling it cold under Vitest takes ~7.5s.
      expect(await screen.findByRole('heading', { name: 'Settings' }, { timeout: 15000 })).toBeTruthy();
    }, 20000);
  });

  describe('Run…', () => {
    let launched: string[] = [];

    afterEach(async () => {
      vi.unstubAllGlobals();
      await Promise.all(launched.map((id) => runsApi.cancelRun(id).catch(() => {})));
      launched = [];
      const { workflows } = await workflowsApi.listWorkflows();
      for (const w of workflows) {
        if (w.name.includes('_test_dashboard_run_')) rmSync(w.path, { force: true });
      }
    });

    it('opens the run dialog without launching anything', async () => {
      // Imported under a unique name, so no other test file's runs share its
      // workflow_id. It's the gate-only fixture, so even a stray launch is free.
      const name = `_test_dashboard_run_${Date.now()}`;
      const { id } = await workflowsApi.importWorkflowDot(
        name,
        readFileSync(join(process.cwd(), '..', 'examples', 'run_launch_check.dot'), 'utf-8')
      );
      vi.stubGlobal('location', { href: '' });
      const user = userEvent.setup();
      renderPage();

      await user.click(within(await rowFor(`${name}.dot`)).getByRole('button', { name: 'Run…' }));

      // The Run sheet loads as its own chunk on first open, which is slow when compiled cold.
      expect(await screen.findByRole('heading', { name: /^Run / }, { timeout: 15000 })).toBeTruthy();
      expect(screen.getByLabelText('Brief')).toBeTruthy();
      expect(location.href).toBe('');
      const { runs } = await runsApi.listRuns();
      expect(runs.filter((r) => r.workflow_id === id)).toEqual([]);
    }, 20000);

    it('titles the dialog with the formatted workflow name', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(within(await rowFor('human_gate_showcase.dot')).getByRole('button', { name: 'Run…' }));

      expect(await screen.findByRole('heading', { name: /^Run .?Human Gate Showcase.?$/ })).toBeTruthy();
    });

    it('launches a real run through the dialog and navigates to it (POST /api/workflows/{id}/run)', async () => {
      vi.stubGlobal('location', { href: '' });
      const user = userEvent.setup();
      renderPage();

      // Human Gate Showcase starts at a human gate, so the launched run parks
      // there and never reaches its LLM nodes.
      await user.click(within(await rowFor('human_gate_showcase.dot')).getByRole('button', { name: 'Run…' }));
      await user.click(await screen.findByRole('button', { name: /^(Run|Start Run)$/ }));

      await waitFor(() => expect(location.href).toMatch(/\/runs\/[a-zA-Z0-9-]+$/), { timeout: 5000 });
      launched.push(location.href.split('/')[2]);
    });
  });

  describe('Import .dot file', () => {
    const helloWorld = readFileSync(join(process.cwd(), '..', 'examples', 'old-examples', 'hello-world.dot'), 'utf-8');

    afterEach(async () => {
      delete window.__TAURI__;
      vi.unstubAllGlobals();
      const { workflows } = await workflowsApi.listWorkflows();
      for (const w of workflows) {
        if (w.name.includes('_test_dashboard_import_')) rmSync(w.path, { force: true });
      }
    });

    // jsdom has no Tauri runtime: stand in for the dialog/fs plugins at the
    // shim boundary with a chosen path and its contents.
    function nativeOpenReturns(path: string, contents: string) {
      window.__TAURI__ = {
        dialog: { open: async () => path },
        fs: { readTextFile: async () => contents },
      };
    }

    it('imports the chosen file under its stem and opens it in the editor', async () => {
      const stem = `_test_dashboard_import_${Date.now()}`;
      nativeOpenReturns(`/Users/test/${stem}.dot`, helloWorld);
      vi.stubGlobal('location', { href: '' });
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: 'Import .dot file' }));

      await waitFor(() => expect(location.href).toMatch(/^\/workflows\/.+\/edit$/), { timeout: 5000 });
      const id = decodeURIComponent(location.href.split('/')[2]);
      const { workflows } = await workflowsApi.listWorkflows();
      expect(workflows.find((w) => w.id === id)?.name).toContain(stem);
      expect(await workflowsApi.getWorkflowDot(id)).toBe(helloWorld);
    });

    it('imports through a file input in the browser', async () => {
      const stem = `_test_dashboard_import_${Date.now()}`;
      vi.stubGlobal('location', { href: '' });
      const user = userEvent.setup();
      renderPage();
      // In a plain browser loadFile() opens a hidden file input; pick the file for it.
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
        const file = new File([helloWorld], `${stem}.dot`, { type: 'text/vnd.graphviz' });
        Object.defineProperty(this, 'files', { configurable: true, value: [file] });
        this.dispatchEvent(new Event('change'));
      });

      try {
        await user.click(screen.getByRole('button', { name: 'Import .dot file' }));
        await waitFor(() => expect(location.href).toMatch(/^\/workflows\/.+\/edit$/), { timeout: 5000 });
      } finally {
        clickSpy.mockRestore();
      }
      const id = decodeURIComponent(location.href.split('/')[2]);
      const { workflows } = await workflowsApi.listWorkflows();
      expect(workflows.find((w) => w.id === id)?.name).toContain(stem);
    });

    it('shows the server parse message inline when the chosen file is not valid DOT', async () => {
      nativeOpenReturns(`/Users/test/_test_dashboard_import_${Date.now()}.dot`, 'digraph { a -> ');
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: 'Import .dot file' }));

      const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
      expect(alert.textContent).toContain('invalid DOT');
    });
  });
});
