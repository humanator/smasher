// ABOUTME: Tests for EditorToolbarActions, the editor's toolbar controls: zoom group, Fit, Export .dot file and Save
// ABOUTME: Rendered on its own with spies for each callback; the canvas tests cover what they drive

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte/svelte5';
import EditorToolbarActions from '../../../src/components/node-editor/EditorToolbarActions.svelte';

function props(overrides: Record<string, unknown> = {}) {
  return {
    zoom: 1,
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onFit: vi.fn(),
    onExport: vi.fn(),
    onSave: vi.fn(),
    saving: false,
    saveDisabled: false,
    ...overrides,
  };
}

describe('EditorToolbarActions', () => {
  it('groups Zoom out, the zoom percentage and Zoom in under Zoom', async () => {
    const p = props({ zoom: 0.756 });
    render(EditorToolbarActions, { props: p });

    const group = screen.getByRole('group', { name: 'Zoom' });
    expect(within(group).getByText('76%')).toBeInTheDocument();
    await fireEvent.click(within(group).getByRole('button', { name: 'Zoom out' }));
    await fireEvent.click(within(group).getByRole('button', { name: 'Zoom in' }));
    expect(p.onZoomOut).toHaveBeenCalledTimes(1);
    expect(p.onZoomIn).toHaveBeenCalledTimes(1);
  });

  it('fits the workflow to the view', async () => {
    const p = props();
    render(EditorToolbarActions, { props: p });

    await fireEvent.click(screen.getByRole('button', { name: 'Fit' }));
    expect(p.onFit).toHaveBeenCalledTimes(1);
  });

  it('exports the .dot file', async () => {
    const p = props();
    render(EditorToolbarActions, { props: p });

    await fireEvent.click(screen.getByRole('button', { name: 'Export .dot file' }));
    expect(p.onExport).toHaveBeenCalledTimes(1);
  });

  it('has no Export .dot file without an export to run (create mode)', () => {
    render(EditorToolbarActions, { props: props({ onExport: undefined }) });
    expect(screen.queryByRole('button', { name: 'Export .dot file' })).toBeNull();
  });

  it('saves, and is disabled when there is nothing to save', async () => {
    const p = props();
    const { rerender } = render(EditorToolbarActions, { props: p });

    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(p.onSave).toHaveBeenCalledTimes(1);

    await rerender({ ...p, saveDisabled: true });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('says Saving… while a save is in flight', () => {
    render(EditorToolbarActions, { props: props({ saving: true, saveDisabled: true }) });
    expect(screen.getByTestId('save-button')).toHaveTextContent('Saving…');
  });
});
