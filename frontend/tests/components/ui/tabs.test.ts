// ABOUTME: Tests for the Tabs primitive's segmented default and line variant
// ABOUTME: Roles and aria-selected stay stable; the variants differ in presentation only

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte/svelte5';
import TabsHost from './TabsHost.svelte';

describe('Tabs', () => {
  it('keeps tablist, tab and aria-selected semantics', async () => {
    render(TabsHost);
    expect(screen.getByRole('tablist')).toBeTruthy();
    const [alpha, beta] = screen.getAllByRole('tab');
    expect(alpha.getAttribute('aria-selected')).toBe('true');
    expect(beta.getAttribute('aria-selected')).toBe('false');
    await fireEvent.mouseDown(beta);
    await fireEvent.click(beta);
    expect(beta.getAttribute('aria-selected')).toBe('true');
  });

  it('is a segmented track by default', () => {
    render(TabsHost);
    const list = screen.getByRole('tablist');
    expect(list.getAttribute('data-variant')).toBe('default');
    expect(list.className).toContain('bg-secondary');
    expect(list.className).not.toContain('border-b');
  });

  it('renders an underlined row for variant="line"', () => {
    render(TabsHost, { props: { variant: 'line' } });
    const list = screen.getByRole('tablist');
    expect(list.getAttribute('data-variant')).toBe('line');
    expect(list.className).toContain('border-b');
    expect(list.className).not.toContain('bg-secondary');
    const tab = screen.getAllByRole('tab')[0];
    expect(tab.className).toContain('group-data-[variant=line]/tabs-list:data-active:border-primary');
  });
});
