// ABOUTME: Tests for inspector/RuleSyntax.svelte, the "Rule syntax" disclosure under connection and Branch rules
// ABOUTME: It reports aria-expanded and, while open, lists the eight operators and the outcome footer

import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import RuleSyntax from '../../../../src/components/node-editor/inspector/RuleSyntax.svelte';
import { RULE_SYNTAX } from '../../../../src/lib/stepFields';

describe('RuleSyntax', () => {
  it('starts closed', () => {
    render(RuleSyntax);

    const toggle = screen.getByRole('button', { name: 'Rule syntax' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('equals')).toBe(null);
  });

  it('opens to every operator and the footer, and closes again', async () => {
    render(RuleSyntax);
    const toggle = screen.getByRole('button', { name: 'Rule syntax' });

    await fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const card = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    for (const row of RULE_SYNTAX.rows) {
      expect(within(card).getByText(row.code).tagName).toBe('CODE');
      expect(within(card).getByText(row.text)).toBeInTheDocument();
    }
    expect(card).toHaveTextContent(
      'After every step, outcome is success, fail, retry or skip. A value that was never saved makes a rule false.',
    );

    await fireEvent.click(toggle);
    expect(screen.queryByText('equals')).toBe(null);
  });
});
