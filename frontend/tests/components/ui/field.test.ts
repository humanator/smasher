// ABOUTME: Tests for the Field composition (label, hint, control, error) from the field boards
// ABOUTME: Checks order, the 11.5px hint/error scale and that errors are announced

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import FieldHost from './FieldHost.svelte';

describe('Field', () => {
  it('labels the control and puts the hint between label and control', () => {
    const { container } = render(FieldHost);
    const input = screen.getByRole('textbox', { name: 'Brief' });
    const slots = [...container.querySelectorAll('[data-slot]')].map((el) => el.getAttribute('data-slot'));
    expect(slots).toEqual(['field', 'field-label', 'field-description', 'input']);
    expect(input).toHaveAccessibleDescription('A short note on what this run is for.');
  });

  it('sets hint and error in the 11.5px hint size', () => {
    render(FieldHost, { props: { error: 'Use name=value' } });
    expect(screen.getByText('A short note on what this run is for.').className.split(' ')).toContain('text-hint');
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Use name=value');
    expect(error.className.split(' ')).toEqual(expect.arrayContaining(['text-hint', 'text-destructive']));
  });
});
