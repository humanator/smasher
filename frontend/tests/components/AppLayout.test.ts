// ABOUTME: Tests for the App.svelte shell: the shared page header bar and each route's layout
// ABOUTME: Catalog (title + New Workflow, Workflows/Runs sections), workflow editor and run detail headers

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/svelte/svelte5';
import { readFileSync } from 'fs';
import { join } from 'path';
import App from '../../src/App.svelte';
import { setApiBaseUrl } from '../../src/lib/api/client-config';
import * as runsApi from '../../src/lib/api/runs';
import * as workflowsApi from '../../src/lib/api/workflows';
import { formatWorkflowName } from '../../src/lib/utils';
import { rmSync } from 'fs';

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

describe('App settings button', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(() => {
    delete window.__TAURI__;
    visit('/');
  });

  it('has no Settings button in a plain browser, where there are no desktop settings', () => {
    visit('/');
    render(App);
    expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
  });

  it('puts a Settings button in the page header in the desktop app', () => {
    window.__TAURI__ = { core: { invoke: async () => undefined as never } };
    visit('/');
    render(App);
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('button', { name: 'Settings' })).toBeTruthy();
    expect(within(header).getByRole('link', { name: 'New Workflow' })).toBeTruthy();
  });
});

describe('App document title', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(() => {
    visit('/');
  });

  it('is Smasher on the catalog, while the header still reads Smasher Pipelines', async () => {
    visit('/');
    render(App);

    await waitFor(() => expect(document.title).toBe('Smasher'));
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('heading', { name: 'Smasher Pipelines' })).toBeTruthy();
  });

  it('puts the run id first on a run page', async () => {
    visit('/runs/no-such-run');
    render(App);

    await waitFor(() => expect(document.title).toBe('Run no-such-run — Smasher'));
  });

  it('is Edit Workflow — Smasher on the editor', async () => {
    visit('/workflows/examples__consensus_task/edit');
    render(App);

    await waitFor(() => expect(document.title).toBe('Edit Workflow — Smasher'));
  });

  it('is New Workflow — Smasher on the new-workflow page', async () => {
    visit('/workflows/new');
    render(App);

    await waitFor(() => expect(document.title).toBe('New Workflow — Smasher'));
  });

  it('follows back navigation from a run page to the catalog', async () => {
    visit('/runs/no-such-run');
    render(App);
    await waitFor(() => expect(document.title).toBe('Run no-such-run — Smasher'));

    visit('/');
    window.dispatchEvent(new PopStateEvent('popstate'));

    await waitFor(() => expect(document.title).toBe('Smasher'));
  });
});

describe('App workflow detail route', () => {
  let imported: string | undefined;

  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(() => {
    visit('/');
    if (imported) rmSync(imported, { force: true });
    imported = undefined;
  });

  it('renders the workflow page, titled with the formatted name', async () => {
    // No leading underscore: it would format to a leading space, which document.title drops.
    const name = `test_AppDetail.v1_${Date.now()}`;
    const { id } = await workflowsApi.importWorkflowDot(
      name,
      readFileSync(join(process.cwd(), '..', 'examples', 'run_launch_check.dot'), 'utf-8')
    );
    imported = (await workflowsApi.listWorkflows()).workflows.find((w) => w.id === id)?.path;

    visit(`/workflows/${encodeURIComponent(id)}`);
    render(App);

    const title = formatWorkflowName(`${name}.dot`);
    await waitFor(() => expect(document.title).toBe(`${title} — Smasher`), { timeout: 4000 });
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('heading', { level: 1, name: title })).toBeTruthy();
    expect(within(header).getByRole('link', { name: 'Smasher Pipelines' })).toBeTruthy();
    expect(within(header).getByRole('button', { name: 'Run Workflow' })).toBeTruthy();
    expect(screen.getByText(/^Source: /)).toBeTruthy();
  });

  it('titles an unknown workflow as not found', async () => {
    visit('/workflows/no-such-workflow');
    render(App);

    expect(await screen.findByText('Workflow not found.', {}, { timeout: 5000 })).toBeTruthy();
    await waitFor(() => expect(document.title).toBe('Workflow not found — Smasher'));
  });

  it('falls back to the catalog for a malformed escape', () => {
    visit('/workflows/%E0%A4%A');
    render(App);

    expect(screen.getByRole('heading', { level: 1, name: 'Smasher Pipelines' })).toBeTruthy();
  });

  it('opens the editor for an id with uppercase letters and dots', async () => {
    const name = `test_AppEdit.v1_${Date.now()}`;
    const { id } = await workflowsApi.importWorkflowDot(
      name,
      readFileSync(join(process.cwd(), '..', 'examples', 'run_launch_check.dot'), 'utf-8')
    );
    imported = (await workflowsApi.listWorkflows()).workflows.find((w) => w.id === id)?.path;

    visit(`/workflows/${encodeURIComponent(id)}/edit`);
    render(App);

    const header = screen.getByRole('banner');
    expect(within(header).getByRole('heading', { level: 1, name: 'Edit Workflow' })).toBeTruthy();
    // Save only appears once the real graph has loaded for the decoded id.
    await waitFor(() => expect(within(header).getByTestId('save-button')).toBeTruthy(), {
      timeout: 5000,
    });
  });

  it('falls back to the catalog for a malformed escape in an edit path', () => {
    visit('/workflows/%E0%A4%A/edit');
    render(App);

    expect(screen.getByRole('heading', { level: 1, name: 'Smasher Pipelines' })).toBeTruthy();
  });
});

