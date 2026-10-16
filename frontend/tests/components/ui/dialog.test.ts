// ABOUTME: Tests for the Dialog primitive's macOS sheet, preference-window and fullscreen variants
// ABOUTME: Class-level checks against Home.dc.html (surface, radius, shadow, scrim, title scale)

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import DialogHost from './DialogHost.svelte';

async function parts(props = {}) {
  render(DialogHost, { props });
  const dialog = await screen.findByRole('dialog');
  const overlay = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;
  return { dialog, overlay, classes: dialog.className.split(' '), scrim: overlay.className.split(' ') };
}

describe('Dialog', () => {
  it('is a top-aligned sheet by default: sheet surface, 12px corners, dialog shadow, light scrim', async () => {
    const { dialog, classes, scrim } = await parts();
    expect(dialog.getAttribute('data-variant')).toBe('sheet');
    expect(classes).toEqual(expect.arrayContaining(['bg-sheet', 'rounded-2xl', 'shadow-dialog', 'top-10', 'p-5', 'sm:max-w-[520px]']));
    expect(classes).not.toContain('top-1/2');
    expect(scrim).toContain('bg-scrim');
    expect(scrim.join(' ')).not.toContain('backdrop-blur');
  });

  it('has a preference-window variant with the window shadow and faint scrim', async () => {
    const { classes, scrim } = await parts({ variant: 'window' });
    expect(classes).toEqual(expect.arrayContaining(['shadow-window', 'p-0', 'sm:max-w-[620px]']));
    expect(scrim).toContain('bg-scrim-faint');
  });

  it('sets the title at 13px bold and the description at 12px, as drawn', async () => {
    await parts();
    expect(screen.getByText('Run “Design review”').className.split(' ')).toEqual(
      expect.arrayContaining(['text-body', 'font-bold'])
    );
    expect(screen.getByText('Everything here is optional.').className.split(' ')).toContain('text-small');
  });

  it('keeps a labelled round close button unless turned off', async () => {
    await parts();
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close.className.split(' ')).toEqual(expect.arrayContaining(['rounded-full', 'size-[22px]']));
  });

  it('drops the close button with showCloseButton={false}', async () => {
    await parts({ showCloseButton: false });
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});
