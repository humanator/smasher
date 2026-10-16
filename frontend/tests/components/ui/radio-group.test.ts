// ABOUTME: Tests for the RadioGroup primitive (no board; styled from the Checkbox board)
// ABOUTME: Checks radiogroup/radio roles, label association, selection and the 14px accent control

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import RadioGroupHost from './RadioGroupHost.svelte';

describe('RadioGroup', () => {
  it('is a labelled radiogroup of labelled radios', () => {
    render(RadioGroupHost);
    expect(screen.getByRole('radiogroup', { name: 'Approve this design?' })).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'yes' }).getAttribute('aria-checked')).toBe('true');
  });

  it('selects an option from its label', async () => {
    const user = userEvent.setup();
    render(RadioGroupHost);
    await user.click(screen.getByText('no'));
    expect(screen.getByRole('radio', { name: 'no' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByTestId('value').textContent).toBe('no');
  });

  it('is a 14px round control with the checkbox shadow and an accent fill when checked', () => {
    render(RadioGroupHost);
    const classes = screen.getByRole('radio', { name: 'yes' }).className.split(' ');
    expect(classes).toEqual(
      expect.arrayContaining(['size-[14px]', 'rounded-full', 'shadow-check', 'data-[state=checked]:bg-primary', 'focus-visible:ring-3'])
    );
  });
});
