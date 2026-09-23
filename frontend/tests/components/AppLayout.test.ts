// ABOUTME: Tests for the catalog view layout in App.svelte
// ABOUTME: Header row with title + New Workflow, main column (Workflows, Runs), Submit Pipeline side panel

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, within } from '@testing-library/svelte/svelte5';
import App from '../../src/App.svelte';
import { setApiBaseUrl } from '../../src/lib/api/client-config';

describe('App catalog layout', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  it('puts the title and New Workflow link together in the page header', () => {
    render(App);
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('heading', { name: 'Smasher Pipelines' })).toBeTruthy();
    const link = within(header).getByRole('link', { name: 'New Workflow' });
    expect(link.getAttribute('href')).toBe('/workflows/new');
  });

  it('renders exactly one New Workflow link', () => {
    render(App);
    expect(screen.getAllByRole('link', { name: /New Workflow/ })).toHaveLength(1);
  });

  it('drops the redundant Available Workflows heading', () => {
    render(App);
    expect(screen.queryByText('Available Workflows')).toBeNull();
  });

  it('shows Submit Pipeline in a side panel, separate from the main column', () => {
    render(App);
    const aside = screen.getByRole('complementary', { name: 'Submit Pipeline' });
    expect(within(aside).getByLabelText('DOT Source:')).toBeTruthy();
    expect(within(aside).queryByText('Loading workflows...')).toBeNull();
  });
});
