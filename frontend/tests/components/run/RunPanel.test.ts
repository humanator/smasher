// ABOUTME: Tests for RunPanel, the run page's right-hand Run information panel with Progress, Activity and Details tabs
// ABOUTME: Covers the tab list's keyboard behaviour, remembered tab, storage that throws, and the sheet below 768px

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import RunPanel from '../../../src/components/run/RunPanel.svelte';
import { WAITING } from '../../fixtures/runEvents';

const NODES = [
  { id: 'start', node_type: 'Start', label: 'Start' },
  { id: 'draft', node_type: 'Codergen', label: 'Draft the concepts' },
  { id: 'lint', node_type: 'Tool', label: 'Check the design system' },
  { id: 'pick', node_type: 'Interviewer', label: 'Pick a favourite' },
  { id: 'exit', node_type: 'Exit', label: 'Finish' },
];

function show(props: Partial<{ open: boolean }> = {}) {
  return render(RunPanel, { props: { open: true, steps: NODES, events: WAITING, ...props } });
}

function mobileViewport(matches: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  return () => (window.matchMedia = original);
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
});

describe('RunPanel', () => {
  it('shows nothing when closed', () => {
    show({ open: false });
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('has Progress, Activity and Details tabs with Progress first and selected', () => {
    show();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent?.trim())).toEqual(['Progress', 'Activity', 'Details']);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('is a labelled region', () => {
    show();
    expect(screen.getByRole('complementary', { name: 'Run information' })).toBeInTheDocument();
  });

  it('shows the steps on the Progress tab, from the events it was given', () => {
    show();
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByText('Pick a favourite')).toBeInTheDocument();
    expect(within(panel).getByText(/of 5 steps done/)).toBeInTheDocument();
  });

  it('shows the events on the Activity tab with the step names it was given', async () => {
    const user = userEvent.setup();
    render(RunPanel, {
      props: { open: true, steps: NODES, events: WAITING, labels: new Map([['pick', 'Pick a favourite']]) },
    });
    await user.click(screen.getByRole('tab', { name: 'Activity' }));
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByRole('radio', { name: 'Key moments' })).toBeInTheDocument();
    expect(within(panel).getByText('Waiting for you')).toBeInTheDocument();
    expect(within(panel).getAllByText(/Pick a favourite/).length).toBeGreaterThan(0);
  });

  it('keeps only the selected tab in the tab order and moves with the arrow keys', async () => {
    const user = userEvent.setup();
    show();
    const [progress, activity, details] = screen.getAllByRole('tab');
    expect(progress).toHaveAttribute('tabindex', '0');
    expect(activity).toHaveAttribute('tabindex', '-1');
    expect(details).toHaveAttribute('tabindex', '-1');

    progress.focus();
    await user.keyboard('{ArrowRight}');
    expect(activity).toHaveFocus();
    expect(activity).toHaveAttribute('aria-selected', 'true');
    expect(activity).toHaveAttribute('tabindex', '0');
    expect(progress).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{ArrowRight}');
    expect(details).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(progress).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(details).toHaveFocus();
  });

  it('remembers the tab for next time', async () => {
    const user = userEvent.setup();
    const first = show();
    await user.click(screen.getByRole('tab', { name: 'Details' }));
    first.unmount();
    show();
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
  });

  it('starts on Progress when storage throws, and still switches tabs', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    const user = userEvent.setup();
    show();
    expect(screen.getByRole('tab', { name: 'Progress' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders as a modal sheet below 768px', () => {
    const restore = mobileViewport(true);
    try {
      show();
      const dialog = screen.getByRole('dialog', { name: 'Run information' });
      expect(within(dialog).getByRole('tablist')).toBeInTheDocument();
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('renders no sheet when closed on a phone', () => {
    const restore = mobileViewport(true);
    try {
      show({ open: false });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('reports a close from the sheet', async () => {
    const restore = mobileViewport(true);
    try {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(RunPanel, { props: { open: true, steps: NODES, events: WAITING, onOpenChange } });
      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    } finally {
      restore();
    }
  });
});
