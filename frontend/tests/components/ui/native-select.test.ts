// ABOUTME: Tests for the NativeSelect primitive's macOS pop-up button styling
// ABOUTME: Checks the accent stepper from Select.dc.html and the full-width default

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import NativeSelect from '../../../src/lib/components/ui/native-select/native-select.svelte';

describe('NativeSelect', () => {
  it('draws the accent stepper as a decorative 16px chip', () => {
    const { container } = render(NativeSelect, { props: { 'aria-label': 'Model' } });
    const stepper = container.querySelector('[data-slot="native-select-icon"]') as HTMLElement;
    expect(stepper.getAttribute('aria-hidden')).toBe('true');
    const classes = stepper.className.split(' ');
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('size-4');
    expect(classes).toContain('rounded-xs');
    expect(stepper.querySelector('svg')?.getAttribute('class')).toContain('text-primary-foreground');
  });

  it('fills its container like the board', () => {
    const { container } = render(NativeSelect, { props: { 'aria-label': 'Model' } });
    const wrapper = container.querySelector('[data-slot="native-select-wrapper"]') as HTMLElement;
    expect(wrapper.className.split(' ')).toContain('w-full');
  });

  it('keeps its accessible name and invalid state', () => {
    render(NativeSelect, { props: { 'aria-label': 'Model', 'aria-invalid': 'true' } });
    const select = screen.getByRole('combobox', { name: 'Model' });
    expect(select.className.split(' ')).toContain('aria-invalid:shadow-[0_0_0_1px_var(--invalid)]');
  });
});
