// ABOUTME: Tests for the Popover, Tooltip and Drawer primitives, rendered open
// ABOUTME: Checks the popover arrow, the drawer's sheet/inspector surfaces and that content still shows

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import OverlaysHost from './OverlaysHost.svelte';

describe('overlays', () => {
  it('shows popover, tooltip and drawer content', async () => {
    render(OverlaysHost);
    expect(await screen.findByText('Popover body')).toBeTruthy();
    expect((await screen.findAllByText('Tooltip text')).length).toBeGreaterThan(0);
    expect(await screen.findByText('Drawer title')).toBeTruthy();
  });

  it('gives the popover an arrow aligned to start', async () => {
    render(OverlaysHost, { props: { popoverAlign: 'start' } });
    const content = (await screen.findByText('Popover body')).closest('[data-slot="popover-content"]') as HTMLElement;
    const arrow = content.querySelector('[data-slot="popover-arrow"]') as HTMLElement;
    expect(arrow).not.toBeNull();
    expect(arrow.className).toContain('left-3.5');
  });

  it('aligns the popover arrow to the end edge', async () => {
    render(OverlaysHost, { props: { popoverAlign: 'end' } });
    const content = (await screen.findByText('Popover body')).closest('[data-slot="popover-content"]') as HTMLElement;
    const arrow = content.querySelector('[data-slot="popover-arrow"]') as HTMLElement;
    expect(arrow.className).toContain('right-3.5');
  });

  it('uses the muted inspector surface for side drawers', async () => {
    render(OverlaysHost, { props: { drawerDirection: 'right' } });
    const content = (await screen.findByText('Drawer title')).closest('[data-slot="drawer-content"]') as HTMLElement;
    expect(content.className).toContain('data-[vaul-drawer-direction=right]:bg-muted');
    expect(content.className).toContain('data-[vaul-drawer-direction=bottom]:bg-popover');
  });
});
