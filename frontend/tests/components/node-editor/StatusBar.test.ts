// ABOUTME: Tests for StatusBar.svelte: step and connection counts, and the no/one/many problems states
// ABOUTME: Review hands the first problem back to the canvas, and hides when that problem has no step or connection

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import StatusBar from '../../../src/components/node-editor/StatusBar.svelte';
import type { Problem } from '../../../src/lib/workflowProblems';

const toolProblem: Problem = { nodeId: 'check', label: 'Check', message: 'needs a tool chosen' };

function renderBar(problems: Problem[], onReview = vi.fn()) {
  render(StatusBar, { props: { stepCount: 7, connectionCount: 8, problems, onReview } });
  return onReview;
}

describe('StatusBar', () => {
  it('counts steps and connections', () => {
    renderBar([]);
    expect(screen.getByText('7 steps · 8 connections')).toBeInTheDocument();
  });

  it('says there are no problems when the workflow is clean', () => {
    renderBar([]);
    expect(screen.getByText('No problems found')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Review' })).toBeNull();
  });

  it('quotes the step for a single problem', () => {
    renderBar([toolProblem]);
    expect(screen.getByText('“Check” needs a tool chosen.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
    expect(screen.queryByText('No problems found')).toBeNull();
  });

  it('counts several problems', () => {
    renderBar([
      toolProblem,
      { nodeId: 'draft', label: 'Draft', message: 'is missing instructions' },
      { message: 'has no Finish step' },
    ]);
    expect(screen.getByText('3 things to fix.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
  });

  it('hands the first problem to onReview', async () => {
    const onReview = renderBar([toolProblem, { message: 'has no Finish step' }]);
    await fireEvent.click(screen.getByRole('button', { name: 'Review' }));
    expect(onReview).toHaveBeenCalledWith(toolProblem);
  });

  it('shows a workflow-level problem without a quoted label, and hides Review', () => {
    renderBar([{ message: 'has no Start step' }]);
    expect(screen.getByText('This workflow has no Start step.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Review' })).toBeNull();
  });

  it('hides Review when the first of several problems is workflow-level', () => {
    renderBar([{ message: 'has no Start step' }, { message: 'has no Finish step' }]);
    expect(screen.getByText('2 things to fix.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Review' })).toBeNull();
  });

  it('announces changes politely', () => {
    renderBar([]);
    expect(screen.getByText('No problems found').closest('[aria-live="polite"]')).not.toBeNull();
  });
});
