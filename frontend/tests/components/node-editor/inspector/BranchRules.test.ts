// ABOUTME: Tests for inspector/BranchRules.svelte, a Branch step's settings: the note, one "Go to “{target}” when…"
// ABOUTME: field per outgoing connection (each editing that edge's condition), the loop sentence and Rule syntax

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import BranchRules from '../../../../src/components/node-editor/inspector/BranchRules.svelte';
import { KIND_NOTES } from '../../../../src/lib/stepFields';

const paths = [
  { id: 'br->ok#0', target: 'Ship it', label: 'yes', loop: false, condition: 'outcome=success' },
  { id: 'br->draft#1', target: 'Draft', label: '', loop: true, condition: null },
];

describe('BranchRules', () => {
  it('starts with the Branch note', () => {
    render(BranchRules, { props: { paths, onChange: vi.fn() } });

    expect(screen.getByText(KIND_NOTES.Conditional)).toBeInTheDocument();
  });

  it('gives each outgoing connection its own rule field, seeded from its condition', () => {
    render(BranchRules, { props: { paths, onChange: vi.fn() } });

    expect(screen.getByRole('textbox', { name: 'Go to “Ship it” when…' })).toHaveValue('outcome=success');
    expect(screen.getByRole('textbox', { name: 'Go to “Draft” when…' })).toHaveValue('');
    expect(screen.getAllByRole('textbox').map((t) => t.getAttribute('data-testid'))).toEqual(['branch-rule-0', 'branch-rule-1']);
  });

  it('names the label in the help, and adds the loop sentence to a loop', () => {
    render(BranchRules, { props: { paths, onChange: vi.fn() } });

    expect(screen.getByTestId('branch-rule-0')).toHaveAccessibleDescription(
      'Connection label: yes. Leave blank to use the label as the rule.',
    );
    expect(screen.getByTestId('branch-rule-1')).toHaveAccessibleDescription(
      'This path loops back and redoes the step. Leave blank to use the label as the rule.',
    );
  });

  it('writes the edited rule to that connection only, and null when cleared', async () => {
    const onChange = vi.fn();
    render(BranchRules, { props: { paths, onChange } });

    await fireEvent.input(screen.getByTestId('branch-rule-1'), { target: { value: 'outcome=fail' } });
    expect(onChange).toHaveBeenLastCalledWith('br->draft#1', 'outcome=fail');

    await fireEvent.input(screen.getByTestId('branch-rule-0'), { target: { value: ' ' } });
    expect(onChange).toHaveBeenLastCalledWith('br->ok#0', null);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('fills a rule from its Try chip', async () => {
    const onChange = vi.fn();
    render(BranchRules, { props: { paths: [paths[1]], onChange } });

    await fireEvent.click(screen.getByRole('button', { name: 'outcome=success' }));

    expect(onChange).toHaveBeenLastCalledWith('br->draft#1', 'outcome=success');
  });

  it('shows just the note and Rule syntax when nothing leaves the Branch', () => {
    render(BranchRules, { props: { paths: [], onChange: vi.fn() } });

    expect(screen.queryByRole('textbox')).toBe(null);
    expect(screen.getByRole('button', { name: 'Rule syntax' })).toBeInTheDocument();
  });
});
