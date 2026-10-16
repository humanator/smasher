// ABOUTME: Tests for Toolbar, the 52px unified bar holding the page title, back link and page controls
// ABOUTME: Covers the single h1, optional subtitle with mono fragments, the back link and the actions snippet

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/svelte/svelte5';
import { createRawSnippet } from 'svelte';
import Toolbar from '../../../src/components/shell/Toolbar.svelte';

const actionsSnippet = createRawSnippet(() => ({
  render: () => '<button type="button">Do the thing</button>',
}));

describe('Toolbar', () => {
  it('renders the title as the only h1, inside the banner', () => {
    render(Toolbar, { props: { title: 'Smasher Pipelines' } });
    const header = screen.getByRole('banner');
    const headings = within(header).getAllByRole('heading');
    expect(headings).toHaveLength(1);
    expect(headings[0].tagName).toBe('H1');
    expect(headings[0].textContent?.trim()).toBe('Smasher Pipelines');
  });

  it('is a window drag region, with its controls still clickable', () => {
    render(Toolbar, { props: { title: 'Runs', actions: actionsSnippet } });
    const header = screen.getByRole('banner');
    expect(header.hasAttribute('data-tauri-drag-region')).toBe(true);
    const button = within(header).getByRole('button', { name: 'Do the thing' });
    // Tauri only drags when the mousedown target itself is the region, so child controls still click.
    expect(button.hasAttribute('data-tauri-drag-region')).toBe(false);
  });

  it('renders a leading snippet ahead of the title', () => {
    render(Toolbar, { props: { title: 'Runs', leading: actionsSnippet } });
    const header = screen.getByRole('banner');
    const button = within(header).getByRole('button', { name: 'Do the thing' });
    const heading = within(header).getByRole('heading', { level: 1 });
    expect(button.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('is 52px tall', () => {
    render(Toolbar, { props: { title: 'x' } });
    expect(screen.getByRole('banner').className).toContain('h-toolbar'); // --spacing-toolbar: 52px (tokens.test.ts)
  });

  it('omits the back link and subtitle by default', () => {
    render(Toolbar, { props: { title: 'Runs' } });
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByTestId('toolbar-subtitle')).toBeNull();
  });

  it('renders a back link labelled with its destination', () => {
    render(Toolbar, { props: { title: 'Edit Workflow', back: { label: 'Smasher Pipelines', href: '/' } } });
    const link = within(screen.getByRole('banner')).getByRole('link', { name: 'Back to Smasher Pipelines' });
    expect(link.getAttribute('href')).toBe('/');
  });

  it('renders the subtitle under the title', () => {
    render(Toolbar, { props: { title: 'Run', subtitle: 'Started just now' } });
    expect(screen.getByTestId('toolbar-subtitle').textContent).toBe('Started just now');
  });

  it('sets backtick fragments of the subtitle in mono', () => {
    render(Toolbar, { props: { title: 'Run', subtitle: 'Workflow `consensus_task.dot` is running' } });
    const subtitle = screen.getByTestId('toolbar-subtitle');
    const code = subtitle.querySelector('code') as HTMLElement;
    expect(code.textContent).toBe('consensus_task.dot');
    expect(code.className).toContain('font-mono');
    expect(subtitle.textContent).toBe('Workflow consensus_task.dot is running');
  });

  it('renders the actions snippet inside the banner', () => {
    render(Toolbar, { props: { title: 'Runs', actions: actionsSnippet } });
    expect(within(screen.getByRole('banner')).getByRole('button', { name: 'Do the thing' })).toBeTruthy();
  });

  it('renders no actions container when there are no actions', () => {
    render(Toolbar, { props: { title: 'Runs' } });
    expect(screen.queryByTestId('page-header-actions')).toBeNull();
  });
});

describe('Toolbar against the boards', () => {
  const badgeSnippet = createRawSnippet(() => ({ render: () => '<span>Running</span>' }));

  it('is an opaque 52px bar with the title at 15px and the subtitle at 11px', () => {
    render(Toolbar, { props: { title: 'Workflows', subtitle: '3 workflows' } });
    const header = screen.getByRole('banner');
    expect(header.className.split(' ')).toEqual(expect.arrayContaining(['h-toolbar', 'bg-background']));
    expect(header.className).not.toContain('backdrop-blur');
    expect(screen.getByRole('heading').className.split(' ')).toContain('text-heading');
    expect(screen.getByTestId('toolbar-subtitle').className.split(' ')).toContain('text-caption');
  });

  it('puts an optional accessory, such as a status badge, beside the title', () => {
    render(Toolbar, { props: { title: 'Design concepts review', titleAccessory: badgeSnippet } });
    const row = screen.getByRole('heading').parentElement as HTMLElement;
    expect(within(row).getByText('Running')).toBeTruthy();
  });
});
