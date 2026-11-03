// ABOUTME: Tests for inspector/Inspector.svelte: the Nothing selected, step, connection and Step guide states
// ABOUTME: Covers the header, the keyboard-driven Settings/About tabs, the About copy, Close and the delete footer

import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import Inspector from '../../../../src/components/node-editor/inspector/Inspector.svelte';

const settings = createRawSnippet(() => ({ render: () => '<p>the settings form</p>' }));

describe('Inspector: nothing selected', () => {
  it('explains what to do and how a workflow runs', () => {
    render(Inspector, { props: { view: { kind: 'none' }, onClose: vi.fn(), onDelete: vi.fn() } });

    const aside = screen.getByRole('complementary', { name: 'Inspector' });
    expect(within(aside).getByRole('heading', { name: 'Nothing selected' })).toBeInTheDocument();
    expect(within(aside).getByText(/Select a step or a connection on the canvas/)).toBeInTheDocument();
    expect(within(aside).getByRole('heading', { name: 'How a workflow runs' })).toBeInTheDocument();
    const steps = within(aside).getAllByRole('listitem');
    expect(steps).toHaveLength(4);
    expect(steps[0]).toHaveTextContent('It begins at Start and runs one step at a time.');
    expect(within(steps[0]).getByText('Start').tagName).toBe('STRONG');
    expect(within(aside).queryByRole('tab')).toBeNull();
    expect(within(aside).queryByRole('button', { name: /Delete/ })).toBeNull();
  });
});

describe('Inspector: a step', () => {
  const view = { kind: 'node' as const, handler: 'Codergen', title: 'Draft three concepts' };

  it('shows the chip, kind kicker, step name and technical name', () => {
    render(Inspector, { props: { view, onClose: vi.fn(), onDelete: vi.fn(), settings } });

    expect(screen.getByText('AI Agent')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Draft three concepts' })).toBeInTheDocument();
    expect(screen.getByText('Also called “Codergen” in workflow files.')).toBeInTheDocument();
    expect(screen.getByTestId('node-inspector-title')).toHaveTextContent('Draft three concepts');
  });

  it('opens on the Settings tab, which holds the form', () => {
    render(Inspector, { props: { view, onClose: vi.fn(), onDelete: vi.fn(), settings } });

    const tablist = screen.getByRole('tablist', { name: 'Inspector sections' });
    const [settingsTab, aboutTab] = within(tablist).getAllByRole('tab');
    expect(settingsTab).toHaveTextContent('Settings');
    expect(aboutTab).toHaveTextContent('About this step');
    expect(settingsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('the settings form')).toBeInTheDocument();
  });

  it('shows the kind’s About sections on the About tab', async () => {
    render(Inspector, { props: { view, onClose: vi.fn(), onDelete: vi.fn(), settings } });

    await fireEvent.click(screen.getByRole('tab', { name: 'About this step' }));

    expect(screen.getByRole('heading', { name: 'What it does' })).toBeInTheDocument();
    expect(screen.getByText(/Starts an AI agent with your instructions/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'If it goes wrong' })).toBeInTheDocument();
    expect(screen.queryByText('the settings form')).toBeNull();
  });

  it('moves between the tabs with the arrow keys, with one tab in the tab order', async () => {
    render(Inspector, { props: { view, onClose: vi.fn(), onDelete: vi.fn(), settings } });
    const settingsTab = screen.getByRole('tab', { name: 'Settings' });
    const aboutTab = screen.getByRole('tab', { name: 'About this step' });
    expect(settingsTab).toHaveAttribute('tabindex', '0');
    expect(aboutTab).toHaveAttribute('tabindex', '-1');

    settingsTab.focus();
    await fireEvent.keyDown(settingsTab, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(aboutTab);
    expect(aboutTab).toHaveAttribute('aria-selected', 'true');
    expect(aboutTab).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('heading', { name: 'What it does' })).toBeInTheDocument();

    await fireEvent.keyDown(aboutTab, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(settingsTab);
    expect(screen.getByText('the settings form')).toBeInTheDocument();
  });

  it('closes from Close inspector', async () => {
    const onClose = vi.fn();
    render(Inspector, { props: { view, onClose, onDelete: vi.fn(), settings } });

    await fireEvent.click(screen.getByRole('button', { name: 'Close inspector' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('deletes from Delete Step', async () => {
    const onDelete = vi.fn();
    render(Inspector, { props: { view, onClose: vi.fn(), onDelete, settings } });

    await fireEvent.click(screen.getByRole('button', { name: 'Delete Step' }));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('names an unknown kind by its handler', () => {
    render(Inspector, {
      props: { view: { kind: 'node', handler: 'FromTheFuture', title: 'Mystery' }, onClose: vi.fn(), onDelete: vi.fn(), settings },
    });
    expect(screen.getByText('Also called “FromTheFuture” in workflow files.')).toBeInTheDocument();
  });
});

describe('Inspector: a connection', () => {
  const view = { kind: 'edge' as const, title: 'Draft → Check' };

  it('shows the Connection kicker and the from → to title, without a technical name', () => {
    render(Inspector, { props: { view, onClose: vi.fn(), onDelete: vi.fn(), settings } });

    expect(screen.getByText('Connection')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Draft → Check' })).toBeInTheDocument();
    expect(screen.getByTestId('edge-inspector-title')).toHaveTextContent('Draft → Check');
    expect(screen.queryByText(/Also called/)).toBeNull();
    expect(screen.getByText('the settings form')).toBeInTheDocument();
  });

  it('has an About this connection tab with the five sections', async () => {
    render(Inspector, { props: { view, onClose: vi.fn(), onDelete: vi.fn(), settings } });

    await fireEvent.click(screen.getByRole('tab', { name: 'About this connection' }));

    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['What it does', 'Rules', 'Labels', 'When more than one matches', 'Loops']);
  });

  it('deletes from Delete Connection', async () => {
    const onDelete = vi.fn();
    render(Inspector, { props: { view, onClose: vi.fn(), onDelete, settings } });

    await fireEvent.click(screen.getByRole('button', { name: 'Delete Connection' }));

    expect(onDelete).toHaveBeenCalledOnce();
  });
});

describe('Inspector: the Step guide', () => {
  it('shows the Step guide kicker, the kind’s name and technical name, without tabs or delete', () => {
    render(Inspector, { props: { view: { kind: 'guide', handler: 'Tool' }, onClose: vi.fn(), onDelete: vi.fn() } });

    const aside = screen.getByTestId('step-guide');
    expect(within(aside).getByText('Step guide')).toBeInTheDocument();
    expect(within(aside).getByRole('heading', { name: 'Tool' })).toBeInTheDocument();
    expect(within(aside).getByText('Also called “Tool” in workflow files.')).toBeInTheDocument();
    expect(within(aside).queryByRole('tab')).toBeNull();
    expect(within(aside).queryByRole('button', { name: /Delete/ })).toBeNull();
  });

  it('shows the kind’s About sections and settings, and Add to Canvas reports the kind', async () => {
    const onAdd = vi.fn();
    render(Inspector, { props: { view: { kind: 'guide', handler: 'Tool' }, onClose: vi.fn(), onDelete: vi.fn(), onAdd } });

    const aside = within(screen.getByTestId('step-guide'));
    expect(aside.getByRole('heading', { name: 'Settings in this step' })).toBeInTheDocument();
    expect(aside.getByText('Pick the built-in tool to run.')).toBeInTheDocument();

    await fireEvent.click(aside.getByRole('button', { name: 'Add to Canvas' }));
    expect(onAdd).toHaveBeenCalledWith('Tool');
  });
});
