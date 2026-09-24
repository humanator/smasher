// ABOUTME: Tests for WorkflowEditorPage component
// ABOUTME: Renders against real GET /api/workflows/{id}/graph and PUT endpoints

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/svelte/svelte5';
import { fireEvent } from '@testing-library/svelte/svelte5';
import { appendFileSync, rmSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import WorkflowEditorPage from '../../../src/components/dashboard/WorkflowEditorPage.svelte';
import { Toaster } from '../../../src/lib/components/ui/sonner/index.js';
import { toast } from 'svelte-sonner';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as workflowsApi from '../../../src/lib/api/workflows';

describe('WorkflowEditorPage', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(() => {
    // Clean up any test workflow files created during tests
    const testFilePrefix = `_test_editor_page_`;
    const examplesDir = join(process.cwd(), '..', 'examples');
    try {
      const files = readdirSync(examplesDir);
      files.forEach((file) => {
        if (file.includes(testFilePrefix) && file.endsWith('.dot')) {
          rmSync(join(examplesDir, file), { force: true });
        }
      });
    } catch {
      // Directory might not exist, that's fine
    }
  });

  it('renders loading state initially', () => {
    // Use a real workflow ID from examples that should exist
    render(WorkflowEditorPage, { props: { workflowId: 'examples__consensus_task' } });
    expect(screen.getByText('Loading workflow...')).toBeTruthy();
  });

  it('loads and renders an existing workflow graph from the API', async () => {
    // examples/human_gate_showcase.dot is a standard fixture
    const workflowId = 'examples__human_gate_showcase';

    render(WorkflowEditorPage, { props: { workflowId } });

    // Wait for loading to complete and canvas to appear
    await waitFor(
      () => {
        // Loading state should be gone
        expect(screen.queryByText('Loading workflow...')).toBeFalsy();
        // Canvas should now be visible (Svelte Flow renders SVG elements)
        const svgElements = document.querySelectorAll('svg');
        expect(svgElements.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  it('displays error when workflow ID does not exist', async () => {
    const invalidId = 'nonexistent__workflow__id';

    render(WorkflowEditorPage, { props: { workflowId: invalidId } });

    // Wait for error to appear
    await waitFor(
      () => {
        const errorElement = screen.queryByRole('alert');
        expect(errorElement).toBeTruthy();
        // Error message will contain HTTP error or "failed to load" text
        const errorText = errorElement?.textContent || '';
        expect(errorText.length).toBeGreaterThan(0);
        expect(errorText).toMatch(/http|failed|error/i);
      },
      { timeout: 5000 }
    );
  });

  it('verifies real graph data is fetched and available for editing', async () => {
    const workflowId = 'examples__consensus_task';

    // Verify the API can fetch the graph first
    const { graph } = await workflowsApi.getWorkflowGraph(workflowId);
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);

    render(WorkflowEditorPage, { props: { workflowId } });

    // Wait for canvas to render with the fetched graph
    await waitFor(
      () => {
        const svgElements = document.querySelectorAll('svg');
        expect(svgElements.length).toBeGreaterThan(0);
        // Should have node elements rendered
        const nodeElements = document.querySelectorAll('[data-id]');
        expect(nodeElements.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  it('saves changes to an existing workflow when Save button is clicked', async () => {
    // First, create a scratch workflow via the API so we don't mutate real fixtures
    const testName = `_test_editor_page_${Date.now()}`;
    const scratchGraph = {
      name: testName,
      nodes: [
        { id: 'start', node_type: 'Start' },
        { id: 'end', node_type: 'Exit' },
      ],
      edges: [{ from: 'start', to: 'end' }],
    };

    // Create the scratch workflow
    const workflowsResponse = await workflowsApi.listWorkflows();
    const targetDir = workflowsResponse.available_target_dirs[0];
    const createResult = await workflowsApi.createWorkflowGraph(scratchGraph, targetDir, testName);
    const workflowId = createResult.id;

    expect(workflowId).toBeTruthy();

    // Now render the editor with the scratch workflow
    render(WorkflowEditorPage, { props: { workflowId } });

    // Wait for the canvas to load the workflow
    await waitFor(
      () => {
        expect(screen.queryByText('Loading workflow...')).toBeFalsy();
        const svgElements = document.querySelectorAll('svg');
        expect(svgElements.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );

    // Get the save button and click it (even without changes, this tests the PUT round-trip)
    const saveButton = screen.getByTestId('save-button');
    await fireEvent.click(saveButton);

    // Wait a bit for the API call to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify the save was successful by re-fetching the graph
    const { graph: updatedGraph } = await workflowsApi.getWorkflowGraph(workflowId);
    expect(updatedGraph).toBeTruthy();
    expect(updatedGraph.nodes.length).toBe(2); // Start and End nodes
    expect(updatedGraph.edges.length).toBe(1); // Start -> End
  });

  describe('saving over a file that changed on disk', () => {
    const scratchDot = 'digraph { start [shape=Mdiamond, label="Start"]; done [shape=doublecircle, label="Done"]; start -> done; }';
    let workflowId: string;
    let path: string;

    beforeEach(async () => {
      const name = `_test_editor_conflict_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      ({ id: workflowId } = await workflowsApi.importWorkflowDot(name, scratchDot));
      const { workflows } = await workflowsApi.listWorkflows();
      path = workflows.find((w) => w.id === workflowId)!.path;
    });

    // Sonner's toast list is global. Close every toast while this test's
    // <Toaster> is still mounted (this hook runs before testing-library's
    // cleanup) so none carries over into the next test.
    afterEach(async () => {
      rmSync(path, { force: true });
      toast.dismiss();
      await waitFor(() => expect(document.querySelector('[data-sonner-toast]')).toBeNull());
    });

    // The conflict shows as a toast, which App.svelte's <Toaster> renders.
    async function renderLoaded() {
      render(Toaster);
      render(WorkflowEditorPage, { props: { workflowId } });
      await screen.findByTestId('save-button', {}, { timeout: 5000 });
    }

    const canvasMounted = () => document.querySelector('.svelte-flow') !== null;

    const conflictToast = () => screen.queryByText(/changed on disk/);
    const toastButton = (name: string) =>
      screen.findByRole('button', { name }, { timeout: 5000 });

    it('toasts the conflict with Reload and Save anyway, keeps the canvas, and leaves the file alone', async () => {
      await renderLoaded();
      appendFileSync(path, '// edited elsewhere\n');
      const changed = readFileSync(path, 'utf-8');

      await fireEvent.click(screen.getByTestId('save-button'));

      const message = await screen.findByText(/changed on disk/, {}, { timeout: 5000 });
      const toast = message.closest('[data-sonner-toast]') as HTMLElement | null;
      expect(toast).not.toBeNull();
      expect(within(toast!).getByRole('button', { name: 'Reload' })).toBeTruthy();
      expect(within(toast!).getByRole('button', { name: 'Save anyway' })).toBeTruthy();
      expect(canvasMounted()).toBe(true);
      expect(readFileSync(path, 'utf-8')).toBe(changed);
    });

    it('Save anyway writes the editor version over the changed file', async () => {
      await renderLoaded();
      appendFileSync(path, '// edited elsewhere\n');
      await fireEvent.click(screen.getByTestId('save-button'));
      await fireEvent.click(await toastButton('Save anyway'));

      await waitFor(() => expect(conflictToast()).toBeNull(), { timeout: 5000 });
      expect(readFileSync(path, 'utf-8')).not.toContain('edited elsewhere');

      // The page now holds the new ETag, so a plain Save works again.
      await fireEvent.click(screen.getByTestId('save-button'));
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(conflictToast()).toBeNull();
      expect(screen.queryByTestId('save-error')).toBeNull();
    });

    it('Reload shows the version on disk and clears the conflict', async () => {
      await renderLoaded();
      writeFileSync(path, scratchDot.replace('label="Done"', 'label="Done elsewhere"'));
      await fireEvent.click(screen.getByTestId('save-button'));
      await fireEvent.click(await toastButton('Reload'));

      await screen.findByText('Done elsewhere', {}, { timeout: 5000 });
      await waitFor(() => expect(conflictToast()).toBeNull(), { timeout: 5000 });

      // The reloaded ETag is current, so saving now succeeds.
      await fireEvent.click(screen.getByTestId('save-button'));
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(conflictToast()).toBeNull();
      expect(readFileSync(path, 'utf-8')).toContain('Done elsewhere');
    });

    it('saves twice in a row with no outside change', async () => {
      await renderLoaded();
      await fireEvent.click(screen.getByTestId('save-button'));
      await waitFor(() => expect(screen.getByTestId('save-button').textContent).toMatch(/^\s*Save\s*$/));
      await new Promise((resolve) => setTimeout(resolve, 300));
      await fireEvent.click(screen.getByTestId('save-button'));
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(conflictToast()).toBeNull();
      expect(screen.queryByTestId('save-error')).toBeNull();
    });

    it('shows any other save failure inline and keeps the canvas', async () => {
      await renderLoaded();
      rmSync(path);

      await fireEvent.click(screen.getByTestId('save-button'));

      const saveError = await screen.findByTestId('save-error', {}, { timeout: 5000 });
      expect(saveError.textContent).toMatch(/workflow/);
      expect(canvasMounted()).toBe(true);
    });
  });

  describe('Export .dot', () => {
    const workflowId = 'examples__human_gate_showcase';
    const onDisk = () =>
      readFileSync(join(process.cwd(), '..', 'examples', 'human_gate_showcase.dot'), 'utf-8');
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    afterEach(() => {
      delete window.__TAURI__;
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    async function renderLoaded() {
      render(WorkflowEditorPage, { props: { workflowId } });
      return await screen.findByTestId('export-dot-button', {}, { timeout: 5000 });
    }

    it('writes the exact workflow source to the path chosen in the native save dialog', async () => {
      // jsdom has no Tauri runtime: stand in for the dialog/fs plugins at the
      // shim boundary and record what the page asks them to do.
      const written: { path: string; contents: string }[] = [];
      window.__TAURI__ = {
        dialog: { save: async () => '/Users/test/exported.dot' },
        fs: {
          writeTextFile: async (path: string, contents: string) => {
            written.push({ path, contents });
          },
        },
      };

      await fireEvent.click(await renderLoaded());

      await waitFor(() => expect(written).toHaveLength(1));
      expect(written[0].path).toBe('/Users/test/exported.dot');
      expect(written[0].contents).toBe(onDisk());
    });

    it('falls back to a browser download of the same source outside Tauri', async () => {
      // jsdom doesn't implement object URLs; capture the blob the shim hands over.
      const blobs: Blob[] = [];
      URL.createObjectURL = (blob: Blob) => {
        blobs.push(blob);
        // A hash URL, so the shim's link click doesn't hit jsdom's
        // unimplemented navigation.
        return '#download';
      };
      URL.revokeObjectURL = () => {};

      await fireEvent.click(await renderLoaded());

      await waitFor(() => expect(blobs).toHaveLength(1));
      expect(await blobs[0].text()).toBe(onDisk());
    });
  });
});
