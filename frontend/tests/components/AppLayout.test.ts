// ABOUTME: Tests for the App.svelte shell: the shared page header bar and each route's layout
// ABOUTME: Catalog (title + New Workflow, Workflows/Runs sections), workflow editor and run detail headers

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/svelte/svelte5';
import { readFileSync } from 'fs';
import { join } from 'path';
import App from '../../src/App.svelte';
import { setApiBaseUrl } from '../../src/lib/api/client-config';
import * as runsApi from '../../src/lib/api/runs';

const humanGateDot = readFileSync(
  join(process.cwd(), '..', 'examples', 'human_gate_showcase.dot'),
  'utf-8'
);

function visit(path: string) {
  window.history.pushState({}, '', path);
}

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

  it('drops the Submit Pipeline panel entirely', () => {
    render(App);
    expect(screen.queryByText('Submit Pipeline')).toBeNull();
    expect(screen.queryByLabelText('DOT Source:')).toBeNull();
  });

  it('renders workflows as a table, matching the Runs table', async () => {
    render(App);
    // Wait for a real workflow row to land before inspecting the table --
    // the list starts empty while GET /api/workflows is in flight.
    await screen.findByText('Human Gate Showcase', {}, { timeout: 5000 });
    const table = screen.getByRole('heading', { name: 'Workflows' }).closest('.workflow-catalog')
      ?.querySelector('table');
    expect(table).toBeTruthy();
    const headerRow = within(table as HTMLElement).getAllByRole('columnheader');
    expect(headerRow.map((th) => th.textContent)).toEqual(
      expect.arrayContaining(['Name', 'Source'])
    );
  });

  it('renders Workflows and Runs as sections under the single page heading', () => {
    render(App);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 2, name: 'Workflows' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Runs' })).toBeTruthy();
  });
});

describe('App page header on other routes', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(() => {
    visit('/');
  });

  it('new-workflow page: breadcrumb back to the catalog, title, and Save in the header', async () => {
    visit('/workflows/new');
    render(App);
    const header = screen.getByRole('banner');
    const crumb = within(header).getByRole('link', { name: 'Smasher Pipelines' });
    expect(crumb.getAttribute('href')).toBe('/');
    expect(within(header).getByRole('heading', { level: 1, name: 'Create New Workflow' })).toBeTruthy();
    await waitFor(() => {
      expect(within(header).getByTestId('save-button')).toBeTruthy();
    });
    // Save moved into the header rather than being duplicated.
    expect(screen.getAllByTestId('save-button')).toHaveLength(1);
    expect(screen.queryByText('← Back to Catalog')).toBeNull();
  });

  it('edit-workflow page: title and Save in the header once the real graph loads', async () => {
    visit('/workflows/examples__consensus_task/edit');
    render(App);
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('heading', { level: 1, name: 'Edit Workflow' })).toBeTruthy();
    expect(within(header).getByRole('link', { name: 'Smasher Pipelines' })).toBeTruthy();
    await waitFor(
      () => {
        expect(within(header).getByTestId('save-button')).toBeTruthy();
      },
      { timeout: 5000 }
    );
    expect(screen.getAllByTestId('save-button')).toHaveLength(1);
  });

  it('run page: run title, status, and Abort in the header for a real running run', async () => {
    const { run_id } = await runsApi.submitRun({ dot_source: humanGateDot, variables: {} });
    try {
      visit(`/runs/${run_id}`);
      render(App);
      const header = screen.getByRole('banner');
      expect(within(header).getByRole('heading', { level: 1, name: `Run ${run_id}` })).toBeTruthy();
      expect(within(header).getByRole('link', { name: 'Smasher Pipelines' })).toBeTruthy();
      await waitFor(
        () => {
          expect(within(header).getByText('Running')).toBeTruthy();
          expect(within(header).getByRole('button', { name: /abort/i })).toBeTruthy();
        },
        { timeout: 5000 }
      );
      expect(screen.getAllByRole('button', { name: /abort/i })).toHaveLength(1);
    } finally {
      await runsApi.cancelRun(run_id);
    }
  });
});
