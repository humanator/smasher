// ABOUTME: Tests for WorkflowCatalog component
// ABOUTME: Renders against the real GET /api/workflows endpoint, no mocking

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/svelte/svelte5';
import WorkflowCatalog from '../../../src/components/dashboard/WorkflowCatalog.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as workflowsApi from '../../../src/lib/api/workflows';

describe('WorkflowCatalog', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  it('renders loading state initially', () => {
    render(WorkflowCatalog);
    expect(screen.getByText('Loading workflows...')).toBeTruthy();
  });

  it('renders the real workflow list from GET /api/workflows', async () => {
    render(WorkflowCatalog);

    // examples/human_gate_showcase.dot is a real fixture in the workflow dir
    // the dev:backend server is configured against (SMASHER_WORKFLOWS_DIR
    // defaults to "examples").
    await waitFor(
      () => {
        expect(screen.getByText('Human Gate Showcase')).toBeTruthy();
      },
      { timeout: 5000 }
    );
  });

  it('launches a real run via the Run Workflow button and navigates to it (POST /api/workflows/{id}/run)', async () => {
    // Regression test: this button used to be an <a href="/runs/new?workflow=...">
    // that nothing consumed and that collided with App.svelte's /runs/{id}
    // route (matched "new" as a literal run id, 404ing every child fetch).
    vi.stubGlobal('location', { href: '' });

    render(WorkflowCatalog);

    await waitFor(
      () => {
        expect(screen.getByText('Consensus Task')).toBeTruthy();
      },
      { timeout: 5000 }
    );

    const row = screen.getByText('Consensus Task').closest('tr') as HTMLElement;
    const runButton = within(row).getByText('Run Workflow');
    await fireEvent.click(runButton);

    await waitFor(
      () => {
        expect(location.href).toMatch(/\/runs\/[a-zA-Z0-9-]+$/);
      },
      { timeout: 5000 }
    );

    vi.unstubAllGlobals();
  });

  describe('Import .dot', () => {
    const helloWorld = readFileSync(
      join(process.cwd(), '..', 'examples', 'old-examples', 'hello-world.dot'),
      'utf-8'
    );

    afterEach(async () => {
      delete window.__TAURI__;
      vi.unstubAllGlobals();
      const { workflows } = await workflowsApi.listWorkflows();
      for (const w of workflows) {
        if (w.name.includes('_test_catalog_import_')) rmSync(w.path, { force: true });
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
      const stem = `_test_catalog_import_${Date.now()}`;
      nativeOpenReturns(`/Users/test/${stem}.dot`, helloWorld);
      vi.stubGlobal('location', { href: '' });
      render(WorkflowCatalog);

      await fireEvent.click(await screen.findByTestId('import-dot-button'));

      await waitFor(() => expect(location.href).toMatch(/^\/workflows\/.+\/edit$/), {
        timeout: 5000,
      });
      const id = decodeURIComponent(location.href.split('/')[2]);
      const { workflows } = await workflowsApi.listWorkflows();
      expect(workflows.find((w) => w.id === id)?.name).toContain(stem);
      expect(await workflowsApi.getWorkflowDot(id)).toBe(helloWorld);
    });

    it('shows the server parse message when the chosen file is not valid DOT', async () => {
      nativeOpenReturns(`/Users/test/_test_catalog_import_${Date.now()}.dot`, 'digraph { a -> ');
      render(WorkflowCatalog);

      await fireEvent.click(await screen.findByTestId('import-dot-button'));

      const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
      expect(alert.textContent).toContain('invalid DOT');
    });
  });
});
