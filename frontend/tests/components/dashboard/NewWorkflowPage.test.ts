// ABOUTME: Tests for NewWorkflowPage component
// ABOUTME: Renders against real POST /api/workflows/new endpoint with real backend

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte/svelte5';
import { existsSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import NewWorkflowPage from '../../../src/components/dashboard/NewWorkflowPage.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as workflowsApi from '../../../src/lib/api/workflows';

describe('NewWorkflowPage', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(() => {
    // Clean up any test workflow files created during tests
    const testFilePrefix = `_test_new_workflow_page_`;
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

  it('renders page header and mounts canvas in create mode', () => {
    render(NewWorkflowPage);
    expect(screen.getByText('Create New Workflow')).toBeTruthy();
    // Back link should exist
    expect(screen.getByText('← Back to Catalog')).toBeTruthy();
  });

  it('fetches available_target_dirs from API on mount', async () => {
    render(NewWorkflowPage);

    // Verify that available directories are fetched by waiting for canvas to render
    // The component will fetch them in onMount
    await waitFor(
      () => {
        // Canvas should render some SVG content once data is loaded
        const svgElements = document.querySelectorAll('svg');
        expect(svgElements.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  it('verifies available_target_dirs can be fetched from API', async () => {
    // Direct API call to verify the data exists
    const response = await workflowsApi.listWorkflows();
    expect(response.available_target_dirs).toBeDefined();
    expect(Array.isArray(response.available_target_dirs)).toBe(true);
    expect(response.available_target_dirs.length).toBeGreaterThan(0);
  });

  it('component mounts without error with real available_target_dirs from API', async () => {
    // Verify the component can successfully fetch and display available directories
    render(NewWorkflowPage);

    // Wait for component to fetch directories and render canvas
    await waitFor(
      () => {
        // If canvas is rendered, the component successfully fetched data
        const canvas = document.querySelector('[data-testid="workflow-canvas"]');
        expect(canvas || document.querySelector('svg')).toBeTruthy();
      },
      { timeout: 5000 }
    );

    // Verify no error message is shown
    expect(screen.queryByRole('alert')).toBeFalsy();
  });

  it('saves a new workflow via createWorkflowGraph API (contract check, not through the UI)', async () => {
    // This test verifies the API round-trip that NewWorkflowPage's onSave handler uses --
    // the test below this one exercises the actual component/Save button.
    const workflowsResponse = await workflowsApi.listWorkflows();
    const targetDir = workflowsResponse.available_target_dirs[0];
    expect(targetDir).toBeTruthy();

    // Create a test workflow using the exact same graph structure the page would send
    const testName = `_test_new_workflow_page_${Date.now()}`;
    const testGraph = {
      nodes: [
        { id: 'start', node_type: 'Start' },
        { id: 'end', node_type: 'Exit' },
      ],
      edges: [{ from: 'start', to: 'end' }],
    };

    // Call the same API that NewWorkflowPage.handleSave calls
    const result = await workflowsApi.createWorkflowGraph(testGraph, targetDir, testName);
    expect(result.id).toBeTruthy();

    // Verify the .dot file was created on disk with valid content
    // The backend runs from the repo root, so we need to construct the path accordingly
    const repoRoot = join(process.cwd(), '..');
    const expectedFilePath = join(repoRoot, targetDir, `${testName}.dot`);

    expect(existsSync(expectedFilePath)).toBe(true);

    const { readFileSync } = await import('fs');
    const content = readFileSync(expectedFilePath, 'utf-8');
    expect(content).toContain('digraph');
    expect(content.length).toBeGreaterThan(50);
  });

  it('creates a real workflow when the rendered Save button is clicked (exercises onSave wiring)', async () => {
    const workflowsResponse = await workflowsApi.listWorkflows();
    const targetDir = workflowsResponse.available_target_dirs[0];
    expect(targetDir).toBeTruthy();

    const testName = `_test_new_workflow_page_${Date.now()}_ui`;

    // handleSave navigates via window.location.href on success -- stub it so
    // jsdom doesn't log a "not implemented: navigation" error, same pattern
    // RunForm.test.ts already uses for the same reason.
    vi.stubGlobal('location', { href: '' });

    render(NewWorkflowPage);

    // Wait for the canvas (and its create-mode fields) to mount.
    const nameInput = await screen.findByTestId('create-name-input');
    const dirSelect = screen.getByTestId('create-target-dir-select') as HTMLSelectElement;

    // The <select>'s <option>s only exist once NewWorkflowPage's onMount
    // fetch resolves and availableTargetDirs is passed down -- WorkflowCanvas
    // then auto-defaults createTargetDir to the first entry itself, so wait
    // for that default to land rather than fireEvent.change-ing a <select>
    // that may not have the matching <option> yet (that race is what made
    // the first version of this test time out: the change event silently
    // no-op'd, createTargetDir stayed empty, and WorkflowCanvas's own
    // handleSave short-circuited on "choose a target directory" without
    // ever calling the onSave prop this test is trying to exercise).
    await waitFor(() => {
      expect(dirSelect.value).toBe(targetDir);
    });

    await fireEvent.input(nameInput, { target: { value: testName } });
    await fireEvent.click(screen.getByTestId('save-button'));

    // Wait for the real POST /api/workflows/new round-trip and the
    // resulting redirect (proves handleSave's onSave wiring actually ran,
    // not just that the API works in isolation).
    await waitFor(
      () => {
        expect(location.href).toContain('/edit');
      },
      { timeout: 5000 }
    );

    const repoRoot = join(process.cwd(), '..');
    const expectedFilePath = join(repoRoot, targetDir, `${testName}.dot`);
    expect(existsSync(expectedFilePath)).toBe(true);

    vi.unstubAllGlobals();
  });
});
