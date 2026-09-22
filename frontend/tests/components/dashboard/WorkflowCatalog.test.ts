// ABOUTME: Tests for WorkflowCatalog component
// ABOUTME: Renders against the real GET /api/workflows endpoint, no mocking

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
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
});
