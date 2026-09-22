// ABOUTME: Tests for WorkflowCatalog component
// ABOUTME: Verifies rendering of workflow list from real API

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import WorkflowCatalog from '../../../src/components/dashboard/WorkflowCatalog.svelte';
import * as workflowsApi from '../../../src/lib/api/workflows';

vi.mock('../../../src/lib/api/workflows', () => ({
  listWorkflows: vi.fn(),
}));

describe('WorkflowCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(workflowsApi.listWorkflows).mockImplementation(() => new Promise(() => {}));
    render(WorkflowCatalog);
    expect(screen.getByText('Loading workflows...')).toBeTruthy();
  });

  it('renders workflow list', async () => {
    vi.mocked(workflowsApi.listWorkflows).mockResolvedValue({
      workflows: [
        {
          id: 'examples__consensus_task',
          name: 'consensus_task.dot',
          source_dir: 'examples',
          path: 'examples/consensus_task.dot',
        },
        {
          id: 'examples__human_gate_showcase',
          name: 'human_gate_showcase.dot',
          source_dir: 'examples',
          path: 'examples/human_gate_showcase.dot',
        },
      ],
    });

    render(WorkflowCatalog);

    // Wait for workflows to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText('Consensus Task')).toBeTruthy();
    expect(screen.getByText('Human Gate Showcase')).toBeTruthy();
  });

  it('renders empty state when no workflows', async () => {
    vi.mocked(workflowsApi.listWorkflows).mockResolvedValue({ workflows: [] });

    render(WorkflowCatalog);

    // Wait for workflows to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText('No workflows configured.')).toBeTruthy();
  });

  it('renders error state', async () => {
    vi.mocked(workflowsApi.listWorkflows).mockRejectedValue(new Error('API error'));

    render(WorkflowCatalog);

    // Wait for error
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText(/Error:/)).toBeTruthy();
  });
});
