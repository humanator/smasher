// ABOUTME: Tests for PageHeader, the top bar holding the page title and page controls
// ABOUTME: Covers title heading, optional breadcrumb trail, and the actions snippet slot

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/svelte/svelte5';
import { createRawSnippet } from 'svelte';
import PageHeader from '../../../src/components/dashboard/PageHeader.svelte';

const actionsSnippet = createRawSnippet(() => ({
  render: () => '<button type="button">Do the thing</button>',
}));

describe('PageHeader', () => {
  it('renders the title as the page heading inside the banner', () => {
    render(PageHeader, { props: { title: 'Smasher Pipelines' } });
    const header = screen.getByRole('banner');
    const heading = within(header).getByRole('heading', { level: 1 });
    expect(heading.textContent?.trim()).toBe('Smasher Pipelines');
  });

  it('omits the breadcrumb trail when there are no parent crumbs', () => {
    render(PageHeader, { props: { title: 'Smasher Pipelines' } });
    expect(screen.queryByRole('navigation', { name: 'breadcrumb' })).toBeNull();
  });

  it('renders parent crumbs as links ahead of the title', () => {
    render(PageHeader, {
      props: { title: 'Edit Workflow', crumbs: [{ label: 'Smasher Pipelines', href: '/' }] },
    });
    const nav = screen.getByRole('navigation', { name: 'breadcrumb' });
    const link = within(nav).getByRole('link', { name: 'Smasher Pipelines' });
    expect(link.getAttribute('href')).toBe('/');
    const heading = screen.getByRole('heading', { level: 1, name: 'Edit Workflow' });
    // The trail reads left-to-right into the title.
    expect(nav.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders the actions snippet inside the banner', () => {
    render(PageHeader, { props: { title: 'Runs', actions: actionsSnippet } });
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('button', { name: 'Do the thing' })).toBeTruthy();
  });

  it('renders no actions container when there are no actions', () => {
    render(PageHeader, { props: { title: 'Runs' } });
    expect(screen.queryByTestId('page-header-actions')).toBeNull();
  });
});
