// ABOUTME: Tests for RunForm component against real API
// ABOUTME: Verifies pipeline submission workflow

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import RunForm from '../../../src/components/dashboard/RunForm.svelte';
import * as runsApi from '../../../src/lib/api/runs';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';

vi.mock('../../../src/lib/api/runs');

describe('RunForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  it('renders form with textarea for DOT source', () => {
    render(RunForm);
    const textarea = screen.getByPlaceholderText('digraph { ... }');
    expect(textarea).toBeTruthy();
    expect(screen.getByText('Submit')).toBeTruthy();
  });

  it('submits workflow and navigates to run detail', async () => {
    const user = userEvent.setup();
    const mockRunId = 'run-123';

    vi.mocked(runsApi.submitRun).mockResolvedValue({
      run_id: mockRunId,
      status: 'Running',
      run_working_dir: 'artifacts/run-123',
    });

    // Mock window.location.href assignment
    const originalHref = window.location.href;
    delete (window.location as any).href;
    window.location.href = '';

    render(RunForm);

    const textarea = screen.getByPlaceholderText('digraph { ... }') as HTMLTextAreaElement;
    await user.type(textarea, 'digraph { a -> b }');

    const submitBtn = screen.getByText('Submit');
    await user.click(submitBtn);

    // Wait for submission
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(runsApi.submitRun).toHaveBeenCalledWith({
      dot_source: 'digraph { a -> b }',
      variables: {},
    });

    // Restore window.location.href
    window.location.href = originalHref;
  });

  it('shows error on submission failure', async () => {
    const user = userEvent.setup();

    vi.mocked(runsApi.submitRun).mockRejectedValue(new Error('API error'));

    render(RunForm);

    const textarea = screen.getByPlaceholderText('digraph { ... }') as HTMLTextAreaElement;
    await user.type(textarea, 'digraph { invalid }');

    await user.click(screen.getByText('Submit'));

    // Wait for error
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText(/Error:/)).toBeTruthy();
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();

    vi.mocked(runsApi.submitRun).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(RunForm);

    const textarea = screen.getByPlaceholderText('digraph { ... }') as HTMLTextAreaElement;
    await user.type(textarea, 'digraph { a -> b }');

    const submitBtn = screen.getByText('Submit') as HTMLButtonElement;
    await user.click(submitBtn);

    // Button should change text and be disabled
    expect(screen.getByText('Submitting...')).toBeTruthy();
    expect(submitBtn.disabled).toBe(true);
  });
});
