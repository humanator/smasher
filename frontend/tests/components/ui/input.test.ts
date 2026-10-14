// ABOUTME: Tests for the Input primitive's search variant
// ABOUTME: The magnifier is decorative, and the field keeps its accessible label

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import Input from '../../../src/lib/components/ui/input/input.svelte';

describe('Input', () => {
  it('renders a bare input by default, with no wrapper or icon', () => {
    const { container } = render(Input, { props: { 'aria-label': 'Name' } });
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(container.firstElementChild).toBe(input);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('with search, adds a leading aria-hidden magnifier and keeps the field label', () => {
    const { container } = render(Input, { props: { search: true, 'aria-label': 'Filter runs' } });
    const input = screen.getByRole('textbox', { name: 'Filter runs' });
    const icon = container.querySelector('svg') as SVGElement;
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(input.parentElement?.contains(icon)).toBe(true);
    expect(input.className).toContain('h-[28px]');
  });

  it('forwards the class to the input in both modes', () => {
    render(Input, { props: { search: true, class: 'extra', 'aria-label': 'x' } });
    expect(screen.getByRole('textbox').className).toContain('extra');
  });
});
