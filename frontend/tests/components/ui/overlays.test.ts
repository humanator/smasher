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

  async function drawer(props: Record<string, unknown>) {
    render(OverlaysHost, { props });
    const content = (await screen.findByText('Drawer title')).closest('[data-slot="drawer-content"]') as HTMLElement;
    const overlay = document.querySelector('[data-slot="drawer-overlay"]') as HTMLElement;
    return { content, classes: content.className, overlay: overlay.className };
  }

  it('floats top and bottom drawers as a centred 420px macOS sheet with 12px corners', async () => {
    const { content, classes } = await drawer({ drawerDirection: 'bottom' });
    for (const cls of ['left-1/2', '-translate-x-1/2', 'top-10', 'max-w-[420px]', 'rounded-2xl', 'shadow-sheet']) {
      expect(classes).toContain(`data-[vaul-drawer-direction=bottom]:${cls}`);
    }
    expect(classes).not.toContain('rounded-t-xl');
    expect(content.querySelector('.rounded-full.bg-border')).toBeNull(); // no drag handle
  });

  it('dims behind sheets but not behind side inspectors', async () => {
    const { overlay } = await drawer({ drawerDirection: 'right' });
    expect(overlay).toContain('bg-scrim-strong');
    expect(overlay).toContain('[&:has(+[data-vaul-drawer-direction=right])]:bg-transparent');
    expect(overlay).not.toContain('backdrop-blur');
  });

  it('sets the title at 13px bold, the description at 12px, and right-aligns the footer', async () => {
    await drawer({ drawerDirection: 'bottom' });
    expect(screen.getByText('Drawer title').className.split(' ')).toEqual(expect.arrayContaining(['text-body', 'font-bold']));
    expect(screen.getByText('Drawer description').className.split(' ')).toContain('text-small');
    const footer = screen.getByRole('button', { name: 'Done' }).parentElement as HTMLElement;
    expect(footer.className.split(' ')).toEqual(expect.arrayContaining(['flex-row', 'justify-end']));
  });

  it('adds a labelled round close button with showClose', async () => {
    await drawer({ drawerDirection: 'bottom', showClose: true });
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close.className.split(' ')).toEqual(expect.arrayContaining(['rounded-full', 'size-[22px]']));
  });
});
