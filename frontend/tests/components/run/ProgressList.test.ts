// ABOUTME: Tests for ProgressList, the run panel's Progress tab: one row per step with kind, state and timing
// ABOUTME: Progress is folded from recorded-shape engine event sequences by the real stepProgress

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/svelte/svelte5';
import ProgressList from '../../../src/components/run/ProgressList.svelte';
import { stepProgress } from '../../../src/lib/runProgress';
import { STEPS, SINGLE_PASS, LOOPED, FAILED, WAITING } from '../../fixtures/runEvents';
import type { PipelineEvent } from '../../../src/lib/api/events';

const NODES = [
  { id: 'start', node_type: 'Start', label: 'Start' },
  { id: 'draft', node_type: 'Codergen', label: 'Draft the concepts' },
  { id: 'lint', node_type: 'Tool', label: 'Check the design system' },
  { id: 'pick', node_type: 'Interviewer', label: 'Pick a favourite' },
  { id: 'exit', node_type: 'Exit', label: 'Finish' },
];

function show(events: PipelineEvent[]) {
  return render(ProgressList, { props: { steps: NODES, progress: stepProgress(STEPS, events) } });
}

const row = (label: string) =>
  screen.getAllByTestId('step-label').find((el) => el.textContent === label)!.closest('li') as HTMLElement;

describe('ProgressList', () => {
  it('lists every step in order with its label', () => {
    show([]);
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => within(li).getByTestId('step-label').textContent)).toEqual(
      NODES.map((n) => n.label)
    );
  });

  it('summarises how many steps are done', () => {
    show(SINGLE_PASS);
    expect(screen.getByText('5 of 5 steps done')).toBeInTheDocument();
  });

  it('counts only finished steps while the run is part way', () => {
    show(WAITING);
    expect(screen.getByText(/^\d of 5 steps done$/)).toBeInTheDocument();
  });

  it('shows the kind and the step meta on one line', () => {
    show(SINGLE_PASS);
    expect(row('Draft the concepts')).toHaveTextContent('AI Agent · 10.0s');
    expect(row('Pick a favourite')).toHaveTextContent('Ask a person · Answered · 25.0s');
  });

  it('describes a looped step', () => {
    show(LOOPED);
    expect(row('Draft the concepts')).toHaveTextContent('Ran twice · went back once');
  });

  it('marks the waiting step as current and says so in words', () => {
    show(WAITING);
    const current = row('Pick a favourite');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current).toHaveTextContent('Waiting for you');
    expect(screen.getAllByRole('listitem').filter((li) => li.hasAttribute('aria-current'))).toHaveLength(1);
  });

  it('shows a failed step with its state in text', () => {
    show(FAILED);
    expect(row('Check the design system')).toHaveTextContent(/Failed.*Tool · Stopped with an error/);
  });

  it('hides every state glyph from assistive technology and still names each state', () => {
    const { container } = show(WAITING);
    const glyphs = container.querySelectorAll('[data-testid="step-glyph"]');
    expect(glyphs).toHaveLength(NODES.length);
    glyphs.forEach((g) => expect(g).toHaveAttribute('aria-hidden', 'true'));
    expect(row('Start')).toHaveTextContent(/Done/);
    expect(row('Finish')).toHaveTextContent(/Not started/);
  });

  it('falls back to the step id when a step has no label', () => {
    render(ProgressList, {
      props: { steps: [{ id: 'mystery', node_type: 'Codergen' }], progress: stepProgress([{ id: 'mystery' }], []) },
    });
    expect(screen.getByTestId('step-label')).toHaveTextContent('mystery');
  });

  it('shows an empty note when there are no steps yet', () => {
    render(ProgressList, { props: { steps: [], progress: [] } });
    expect(screen.getByText('No steps to show yet.')).toBeInTheDocument();
  });
});
