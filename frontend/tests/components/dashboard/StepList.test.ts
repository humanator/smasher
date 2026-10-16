// ABOUTME: Tests for StepList, the workflow page's "What it does" section
// ABOUTME: Populated (order, names, plain kinds), loading, error with Try Again, and empty states

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/svelte/svelte5';
import StepList from '../../../src/components/dashboard/StepList.svelte';
import type { EditorNode } from '../../../src/lib/api/workflows';

const STEPS: EditorNode[] = [
  { id: 'start', node_type: 'Start' },
  { id: 'draft', node_type: 'Codergen', label: 'Draft three concepts' },
  { id: 'lint', node_type: 'Tool', label: 'Check against design system' },
  { id: 'checks', node_type: 'Conditional', label: 'Did the checks pass?' },
  { id: 'pick', node_type: 'Interviewer', label: 'Pick a favourite' },
  { id: 'done', node_type: 'Exit', label: 'Done' },
];
const INTRO =
  'The steps in order. If “Did the checks pass?” says no, the workflow goes back to the first step and tries again.';

function section() {
  return screen.getByRole('region', { name: 'What it does' });
}

describe('StepList', () => {
  it('lists the steps in order with their names and plain kinds under the heading and intro', () => {
    render(StepList, { props: { steps: STEPS, intro: INTRO, editHref: '/workflows/x/edit', onRetry: () => {} } });

    expect(within(section()).getByRole('heading', { level: 2, name: 'What it does' })).toBeTruthy();
    expect(within(section()).getByText(INTRO)).toBeTruthy();
    const items = within(within(section()).getByRole('list')).getAllByRole('listitem');
    expect(items.map((li) => li.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      '1 start Start',
      '2 Draft three concepts AI Agent',
      '3 Check against design system Tool',
      '4 Did the checks pass? Branch',
      '5 Pick a favourite Ask a person',
      '6 Done Finish',
    ]);
  });

  it('never shows a raw handler name', () => {
    const { container } = render(StepList, {
      props: { steps: STEPS, intro: INTRO, editHref: '/workflows/x/edit', onRetry: () => {} },
    });
    expect(container.textContent).not.toMatch(/Codergen|Conditional|Interviewer|wait\.human|codergen/);
  });

  it('shows a skeleton while loading, and no list', () => {
    render(StepList, { props: { steps: [], intro: '', loading: true, editHref: '/e', onRetry: () => {} } });

    expect(within(section()).getByRole('status', { name: 'Loading steps' })).toBeTruthy();
    expect(within(section()).queryByRole('list')).toBeNull();
  });

  it('shows a failed read with Try Again', async () => {
    const onRetry = vi.fn();
    render(StepList, { props: { steps: [], intro: '', error: 'HTTP 500', editHref: '/e', onRetry } });

    const alert = within(section()).getByRole('alert');
    expect(alert.textContent).toContain("Couldn't read this workflow's steps. HTTP 500");
    await fireEvent.click(within(alert).getByRole('button', { name: 'Try Again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('says a workflow with no steps has none yet, and links to the editor', () => {
    render(StepList, { props: { steps: [], intro: 'The steps in order.', editHref: '/workflows/x/edit', onRetry: () => {} } });

    expect(within(section()).getByText('This workflow has no steps yet.')).toBeTruthy();
    expect(within(section()).getByRole('link', { name: 'Edit Workflow' })).toHaveAttribute('href', '/workflows/x/edit');
    expect(within(section()).queryByRole('list')).toBeNull();
  });
});
