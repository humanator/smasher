// ABOUTME: Tests for the Accordion primitive's grouped disclosure box
// ABOUTME: Items share one bordered box, and a triangle rotates when its item is open

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte/svelte5';
import AccordionHost from './AccordionHost.svelte';

describe('Accordion', () => {
  it('puts every item in one bordered box', () => {
    const { container } = render(AccordionHost);
    const root = container.querySelector('[data-slot="accordion"]') as HTMLElement;
    expect(root.className).toContain('border');
    expect(root.className).toContain('rounded-[10px]');
    expect(root.querySelectorAll('[data-slot="accordion-item"]')).toHaveLength(2);
  });

  it('uses one triangle per trigger that rotates when open', () => {
    render(AccordionHost);
    const first = screen.getByRole('button', { name: 'First' });
    const icons = first.querySelectorAll('[data-slot="accordion-trigger-icon"]');
    expect(icons).toHaveLength(1);
    expect(icons[0].getAttribute('class')).toContain('group-aria-expanded/accordion-trigger:rotate-90');
    expect(first.getAttribute('aria-expanded')).toBe('true');
  });

  it('still opens and closes items', async () => {
    render(AccordionHost);
    const second = screen.getByRole('button', { name: 'Second' });
    expect(second.getAttribute('aria-expanded')).toBe('false');
    await fireEvent.click(second);
    expect(second.getAttribute('aria-expanded')).toBe('true');
  });
});
