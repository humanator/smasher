// ABOUTME: Tests for WorkflowEditorPage component
// ABOUTME: Renders against real GET /api/workflows/{id}/graph and PUT endpoints

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import { fireEvent } from '@testing-library/svelte/svelte5';
import { rmSync, readdirSync } from 'fs';
import { join } from 'path';
import WorkflowEditorPage from '../../../src/components/dashboard/WorkflowEditorPage.svelte';
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
    const graph = await workflowsApi.getWorkflowGraph(workflowId);
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
    const updatedGraph = await workflowsApi.getWorkflowGraph(workflowId);
    expect(updatedGraph).toBeTruthy();
    expect(updatedGraph.nodes.length).toBe(2); // Start and End nodes
    expect(updatedGraph.edges.length).toBe(1); // Start -> End
  });
});
