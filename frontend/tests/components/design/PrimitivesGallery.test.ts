// ABOUTME: Tests for the primitives gallery, the one page that shows every restyled primitive in every state
// ABOUTME: Checks each primitive has a section and the variant matrix is complete, so nothing can go missing unseen

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/svelte/svelte5';
import PrimitivesGallery from '../../../src/components/design/PrimitivesGallery.svelte';

const SECTIONS = [
  'Colours',
  'Type',
  'Radius and elevation',
  'Step kinds',
  'Button',
  'Badge',
  'Input',
  'Textarea',
  'Select',
  'Checkbox',
  'Switch',
  'Tabs',
  'Toggle group',
  'Accordion',
  'Tooltip',
  'Popover',
  'Drawer',
  'Field',
  'Radio group',
  'Card',
  'Dialog',
];

describe('PrimitivesGallery', () => {
  it.each(SECTIONS)('has a %s section', (name) => {
    render(PrimitivesGallery);
    expect(screen.getByRole('heading', { level: 2, name })).toBeTruthy();
  });

  it('shows every button variant at every size', () => {
    render(PrimitivesGallery);
    const section = screen.getByRole('region', { name: 'Button' });
    for (const variant of ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link']) {
      expect(within(section).getByTestId(`button-row-${variant}`), variant).toBeTruthy();
      expect(
        within(within(section).getByTestId(`button-row-${variant}`)).getAllByRole('button').length,
        variant
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it('shows every badge variant, with and without a dot', () => {
    render(PrimitivesGallery);
    const section = screen.getByRole('region', { name: 'Badge' });
    expect(section.querySelectorAll('[data-slot="badge"]').length).toBeGreaterThanOrEqual(7);
    expect(section.querySelectorAll('[data-slot="badge-dot"]').length).toBeGreaterThanOrEqual(2);
  });

  it('shows both tab variants, both toggle-group variants and both switch sizes', () => {
    render(PrimitivesGallery);
    const tabs = screen.getByRole('region', { name: 'Tabs' });
    expect(tabs.querySelector('[data-variant="default"]')).not.toBeNull();
    expect(tabs.querySelector('[data-variant="line"]')).not.toBeNull();
    const toggles = screen.getByRole('region', { name: 'Toggle group' });
    expect(toggles.querySelector('[data-variant="default"]')).not.toBeNull();
    expect(toggles.querySelector('[data-variant="outline"]')).not.toBeNull();
    const switches = screen.getByRole('region', { name: 'Switch' });
    expect(switches.querySelector('[data-size="default"]')).not.toBeNull();
    expect(switches.querySelector('[data-size="sm"]')).not.toBeNull();
  });

  it('shows the search input, an invalid input and a disabled input', () => {
    render(PrimitivesGallery);
    const section = screen.getByRole('region', { name: 'Input' });
    expect(within(section).getByRole('textbox', { name: 'Search field' })).toBeTruthy();
    expect(section.querySelector('input[aria-invalid="true"]')).not.toBeNull();
    expect(section.querySelector('input:disabled')).not.toBeNull();
  });

  it('renders a swatch for every step kind', () => {
    render(PrimitivesGallery);
    const section = screen.getByRole('region', { name: 'Step kinds' });
    for (const plain of ['AI Agent', 'AI Coordinator', 'Tool', 'Ask a person', 'Branch', 'Split', 'Join', 'Nested workflow', 'Start', 'Finish']) {
      expect(within(section).getAllByText(plain).length, plain).toBeGreaterThan(0);
    }
  });

  it('opens the drawers and the popover from their triggers', () => {
    render(PrimitivesGallery);
    expect(screen.getByRole('button', { name: 'Open inspector drawer' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open sheet drawer' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open popover' })).toBeTruthy();
  });
});
