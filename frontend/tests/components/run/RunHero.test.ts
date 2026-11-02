// ABOUTME: Tests for RunHero, the run page's state block: needs you, running, finished, couldn't finish, stopped
// ABOUTME: Passes the hero model in directly; Show Results in Finder runs against a stand-in Tauri invoke

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte/svelte5';
import RunHero from '../../../src/components/run/RunHero.svelte';
import type { HeroModel } from '../../../src/lib/runHero';

const running: HeroModel = { state: 'running', heading: 'Draft three concepts', text: 'Gives an AI model a brief.', iterating: false };
const completed: HeroModel = { state: 'completed', heading: 'Finished in 10 min 35 s', text: 'All 5 steps ran to the end.' };
const failed: HeroModel = {
  state: 'failed',
  heading: "Check against design system couldn't finish",
  message: 'Missing candidate_dir.',
  advice: ['Make sure a step before it produces one.', "Open the workflow in the editor and check this step's settings."],
};
const aborted: HeroModel = { state: 'aborted', heading: 'Stopped by you', text: 'You stopped this run before it finished.' };

afterEach(() => {
  delete window.__TAURI__;
});

describe('RunHero', () => {
  it('shows the question under its gate for a run that needs you', () => {
    render(RunHero, {
      props: { hero: { state: 'waiting', eyebrow: 'Pick a favourite · Ask a person', heading: 'Which concept?' } },
    });
    expect(screen.getByText('Pick a favourite · Ask a person')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Which concept?' })).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is a polite live region only while running', () => {
    const { unmount } = render(RunHero, { props: { hero: running } });
    const hero = screen.getByTestId('run-hero');
    expect(hero).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Now running')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Draft three concepts' })).toBeTruthy();
    expect(screen.getByText('Gives an AI model a brief.')).toBeTruthy();
    unmount();

    for (const hero of [completed, failed, aborted]) {
      const view = render(RunHero, { props: { hero } });
      expect(screen.getByTestId('run-hero')).not.toHaveAttribute('aria-live');
      view.unmount();
    }
  });

  it('shows the finished heading and sentence, with no Finder button in a browser', () => {
    render(RunHero, { props: { hero: completed, resultsPath: 'artifacts/r1' } });
    expect(screen.getByRole('heading', { level: 2, name: 'Finished in 10 min 35 s' })).toBeTruthy();
    expect(screen.getByText('All 5 steps ran to the end.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show Results in Finder' })).toBeNull();
  });

  it('reveals the run folder from Show Results in Finder in the desktop app', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined);
    window.__TAURI__ = { core: { invoke } };
    render(RunHero, { props: { hero: completed, resultsPath: 'artifacts/r1' } });

    await fireEvent.click(screen.getByRole('button', { name: 'Show Results in Finder' }));
    expect(invoke).toHaveBeenCalledWith('reveal_run_folder', { path: 'artifacts/r1' });
  });

  it('says so inline when Finder cannot be opened', async () => {
    window.__TAURI__ = { core: { invoke: vi.fn().mockRejectedValue(new Error('outside the runs folder')) } };
    render(RunHero, { props: { hero: completed, resultsPath: 'artifacts/r1' } });

    await fireEvent.click(screen.getByRole('button', { name: 'Show Results in Finder' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain("Couldn't show the results in Finder"));
  });

  it('hides Show Results in Finder when the run has no folder', () => {
    window.__TAURI__ = { core: { invoke: vi.fn() } };
    render(RunHero, { props: { hero: completed } });
    expect(screen.queryByRole('button', { name: 'Show Results in Finder' })).toBeNull();
  });

  it('shows a failed run as an alert with the message, advice, Open in Editor and Run Again', async () => {
    const onRunAgain = vi.fn();
    render(RunHero, { props: { hero: failed, editHref: '/workflows/w1/edit', onRunAgain } });

    const alert = screen.getByRole('alert');
    expect(alert).toBe(screen.getByTestId('run-hero'));
    expect(screen.getByRole('heading', { level: 2, name: "Check against design system couldn't finish" })).toBeTruthy();
    expect(screen.getByText('Missing candidate_dir.')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'What you can try' })).toBeTruthy();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(failed.state === 'failed' ? failed.advice : []);
    expect(screen.getByRole('link', { name: 'Open in Editor' })).toHaveAttribute('href', '/workflows/w1/edit');
    await fireEvent.click(screen.getByRole('button', { name: 'Run Again' }));
    expect(onRunAgain).toHaveBeenCalledOnce();
  });

  it('leaves out Open in Editor and Run Again for a run with no workflow', () => {
    render(RunHero, { props: { hero: failed } });
    expect(screen.queryByRole('link', { name: 'Open in Editor' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Run Again' })).toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: 'What you can try' })).toBeTruthy();
  });

  it('shows a stopped run neutrally: no alert, no advice, Run Again offered', () => {
    render(RunHero, { props: { hero: aborted, editHref: '/workflows/w1/edit', onRunAgain: () => {} } });
    expect(screen.getByRole('heading', { level: 2, name: 'Stopped by you' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('What you can try')).toBeNull();
    expect(screen.getByRole('button', { name: 'Run Again' })).toBeTruthy();
  });
});
