// ABOUTME: Tests for SourceList, the sidebar content: Library nav, Workflows nav, footer and collapse toggle
// ABOUTME: Presentational, so every case passes plain props; no network involved

import { describe, it, expect } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/svelte/svelte5';
import SourceListHost from './SourceListHost.svelte';

const workflows = [
  { id: 'examples__human_gate', label: 'Human Gate', state: 'needs-you' as const },
  { id: 'examples__consensus_task', label: 'Consensus Task', state: 'running' as const },
  { id: 'My Flow.v1', label: 'My Flow.v1', state: null },
];

function mount(overrides: Record<string, unknown> = {}) {
  return render(SourceListHost, {
    props: {
      workflows,
      runCount: 12,
      needsYouCount: 2,
      currentWorkflowId: null,
      native: false,
      ...overrides,
    },
  });
}

describe('SourceList landmarks', () => {
  it('has an aside with labelled Library and Workflows navs', () => {
    mount();
    expect(screen.getByRole('complementary')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Library' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Workflows' })).toBeTruthy();
  });
});

describe('SourceList Library nav', () => {
  it('links to the catalog, the runs table and the needs-you filter', () => {
    mount();
    const nav = screen.getByRole('navigation', { name: 'Library' });
    expect(within(nav).getByRole('link', { name: /^Workflows/ }).getAttribute('href')).toBe('/');
    expect(within(nav).getByRole('link', { name: /^Recent runs/ }).getAttribute('href')).toBe('/#runs');
    expect(within(nav).getByRole('link', { name: /^Needs you/ }).getAttribute('href')).toBe(
      '/?runs=needs-you#runs'
    );
  });

  it('shows the workflow count, run count and a needs-you pill', () => {
    mount();
    const nav = screen.getByRole('navigation', { name: 'Library' });
    expect(within(nav).getByRole('link', { name: /^Workflows/ }).textContent).toContain('3');
    expect(within(nav).getByRole('link', { name: /^Recent runs/ }).textContent).toContain('12');
    expect(within(nav).getByRole('link', { name: /^Needs you/ }).textContent).toContain('2');
    expect(within(nav).getByTestId('needs-you-count').getAttribute('data-slot')).toBe('badge');
  });

  it('hides the needs-you pill at 0', () => {
    mount({ needsYouCount: 0 });
    expect(screen.queryByTestId('needs-you-count')).toBeNull();
    expect(screen.getByRole('link', { name: /^Needs you/ })).toBeTruthy();
  });
});

describe('SourceList Workflows nav', () => {
  it('links each workflow by display name to its page, encoding the id', () => {
    mount();
    const nav = screen.getByRole('navigation', { name: 'Workflows' });
    expect(within(nav).getByRole('link', { name: /Human Gate/ }).getAttribute('href')).toBe(
      '/workflows/examples__human_gate'
    );
    expect(within(nav).getByRole('link', { name: /My Flow\.v1/ }).getAttribute('href')).toBe(
      '/workflows/My%20Flow.v1'
    );
  });

  it('marks the current workflow with aria-current="page" and no other', () => {
    mount({ currentWorkflowId: 'examples__consensus_task' });
    const nav = screen.getByRole('navigation', { name: 'Workflows' });
    const current = within(nav).getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toContain('Consensus Task');
  });

  it('gives each state dot visually hidden text and none for idle workflows', () => {
    mount();
    const nav = screen.getByRole('navigation', { name: 'Workflows' });
    const humanGate = within(nav).getByRole('link', { name: /Human Gate/ });
    expect(within(humanGate).getByText('needs you').className).toContain('sr-only');
    const consensus = within(nav).getByRole('link', { name: /Consensus Task/ });
    expect(within(consensus).getByText('running').className).toContain('sr-only');
    const idle = within(nav).getByRole('link', { name: /My Flow/ });
    expect(idle.querySelector('[data-testid="state-dot"]')).toBeNull();
    expect(humanGate.querySelector('[data-testid="state-dot"]')).not.toBeNull();
  });
});

describe('SourceList footer', () => {
  it.each([
    [0, 'Smasher'],
    [1, 'Smasher · 1 run needs your decision'],
    [2, 'Smasher · 2 runs need your decision'],
  ])('with %i needing you reads "%s"', (needsYouCount, text) => {
    mount({ needsYouCount });
    expect(screen.getByTestId('sidebar-footer').textContent?.trim()).toBe(text);
  });
});

describe('SourceList header and collapse', () => {
  it('shows the wordmark in a browser and no drag region', () => {
    const { container } = mount({ native: false });
    expect(screen.getByText('Smasher', { selector: '[data-testid="wordmark"]' })).toBeTruthy();
    expect(container.querySelector('[data-tauri-drag-region]')).toBeNull();
  });

  it('leaves a drag region with room for the traffic lights, and no wordmark, in the native app', () => {
    const { container } = mount({ native: true });
    expect(screen.queryByTestId('wordmark')).toBeNull();
    const region = container.querySelector('[data-tauri-drag-region]') as HTMLElement;
    expect(region).not.toBeNull();
    expect(region.className).toContain('pl-[78px]');
  });

  it('collapses and expands from the toggle, flipping aria-expanded and the labels', async () => {
    mount();
    const toggle = screen.getByRole('button', { name: 'Toggle sidebar' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Recent runs')).toBeTruthy();

    await fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Recent runs')).toBeNull();
    expect(screen.queryByTestId('sidebar-footer')).toBeNull();

    await fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Recent runs')).toBeTruthy();
  });

  it('keeps a title on every row when collapsed', async () => {
    mount();
    await fireEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));
    for (const nav of ['Library', 'Workflows']) {
      for (const link of within(screen.getByRole('navigation', { name: nav })).getAllByRole('link')) {
        expect(link.getAttribute('title'), `${nav} row`).toBeTruthy();
      }
    }
  });
});
