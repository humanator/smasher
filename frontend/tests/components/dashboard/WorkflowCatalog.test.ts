// ABOUTME: Tests for WorkflowCatalog component
// ABOUTME: Renders against the real GET /api/workflows endpoint, no mocking

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/svelte/svelte5';
import WorkflowCatalog from '../../../src/components/dashboard/WorkflowCatalog.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';

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

    const card = screen.getByText('Consensus Task').closest('.workflow-card') as HTMLElement;
    const runButton = within(card).getByText('Run Workflow');
    await fireEvent.click(runButton);

    await waitFor(
      () => {
        expect(location.href).toMatch(/\/runs\/[a-zA-Z0-9-]+$/);
      },
      { timeout: 5000 }
    );

    vi.unstubAllGlobals();
  });
});
