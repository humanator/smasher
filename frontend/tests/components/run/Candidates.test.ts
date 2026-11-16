// ABOUTME: Tests for Candidates, the run page's grid of gallery candidates
// ABOUTME: Real candidates: manifests written to the test backend's artifacts dir, listed through the real API

import type { ComponentProps } from 'svelte';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import Candidates from '../../../src/components/run/Candidates.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import { ANONYMOUS_GATE, cancelAll, submitGraph } from '../../fixtures/graphs';

// Matches smasher-web's default_data_dir(): $SMASHER_DATA_DIR, else ~/Documents/smasher.
const dataDir = process.env.SMASHER_DATA_DIR ?? join(homedir(), 'Documents', 'smasher');
const artifactsRoot = join(dataDir, 'artifacts');

function writeManifest(
  runId: string,
  candidateId: string,
  exitStatus: Record<string, unknown> = { status: 'success' },
  generationParams: Record<string, string> = {}
) {
  const dir = join(artifactsRoot, runId, 'artifacts', candidateId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify({
      captured_at: '2026-09-25T07:00:00Z',
      viewport: { width: 1280, height: 800 },
      candidate_dir: `/tmp/${candidateId}`,
      exit_status: exitStatus,
      artifacts: [],
      generation_params: generationParams,
    })
  );
  return dir;
}

// A parked run to hang candidates on; it never reaches an LLM.
async function runWith(seed: (runId: string, dir: typeof writeManifest) => void) {
  const runId = await submitGraph(ANONYMOUS_GATE);
  seed(runId, writeManifest);
  const { candidates } = await runsApi.listCandidates(runId);
  return candidates;
}

type Props = ComponentProps<typeof Candidates>;

function renderCandidates(candidates: Props['candidates'], props: Partial<Props> = {}) {
  return render(Candidates, { props: { candidates, ...props } });
}

const selectButton = (id: string) => screen.getByRole('button', { name: new RegExp(`^Select(ed)? ${id}$`) });

describe('Candidates', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    // bits-ui's scroll lock clears this on a timer after the open dialog unmounts.
    document.body.style.pointerEvents = '';
    await cancelAll();
  });

  describe('the section', () => {
    it('has a Candidates heading, a responsive grid of 240px columns and the expected-versus-found meta', async () => {
      const candidates = await runWith((id, write) => {
        write(id, 'candidate-a');
        write(id, 'candidate-b');
        write(id, 'candidate-c', { status: 'failed', reason: 'render timed out' });
      });
      renderCandidates(candidates, { expected: 4 });

      expect(screen.getByRole('heading', { level: 2, name: 'Candidates' })).toBeTruthy();
      expect(screen.getByText('Expected 4, found 3 · 1 could not be rendered')).toBeTruthy();
      expect(screen.getByTestId('candidate-grid').className).toContain('minmax(240px,1fr)');
    });

    it('says how many it found when no count is expected, and leaves out the failure count when none failed', async () => {
      const candidates = await runWith((id, write) => {
        write(id, 'candidate-a');
        write(id, 'candidate-b');
      });
      renderCandidates(candidates);

      expect(screen.getByText('Found 2')).toBeTruthy();
    });
  });

  describe('a rendered candidate', () => {
    it('shows its id, a screenshot thumbnail (never an embed) and scorecard badges with their violations', async () => {
      const candidates = await runWith((id, write) => {
        const dirA = write(id, 'candidate-a');
        writeFileSync(
          join(dirA, 'lint-report.json'),
          JSON.stringify({
            checks: [{ name: 'token-adherence', passed: false, violations: ['raw hex color'] }],
          })
        );
        writeFileSync(
          join(dirA, 'synthesis-report.json'),
          JSON.stringify({ recommendation: 'iterate', reasons: ['lint failed'] })
        );
        write(id, 'candidate-b');
      });
      renderCandidates(candidates);

      expect(screen.getByText('candidate-a')).toBeTruthy();
      expect(screen.getByText('Design-system check: 1 issue')).toBeTruthy();
      expect(screen.getByText('raw hex color')).toBeTruthy();
      expect(screen.getByText('Recommendation: Iterate')).toBeTruthy();
      // The engine's own name is the tooltip.
      expect(screen.getByText('Recommendation: Iterate').closest('[title]')?.getAttribute('title')).toContain('synthesis');
      for (const id of ['candidate-a', 'candidate-b']) {
        const thumbnail = screen.getByRole('button', { name: `Open preview of ${id}` });
        expect(thumbnail.querySelector('img')?.getAttribute('alt')).toBe(`Candidate ${id}`);
      }
      expect(document.querySelector('iframe')).toBeNull();
    });

    it('reads a proceed recommendation as Advance, and a clean critic report as no friction', async () => {
      const candidates = await runWith((id, write) => {
        const dir = write(id, 'candidate-a');
        writeFileSync(join(dir, 'synthesis-report.json'), JSON.stringify({ recommendation: 'proceed', reasons: [] }));
        writeFileSync(
          join(dir, 'critic-report.json'),
          JSON.stringify({ persona: 'p', task: 't', success: true, friction: [], notes: '' })
        );
      });
      renderCandidates(candidates);

      expect(screen.getByText('Recommendation: Advance')).toBeTruthy();
      expect(screen.getByText('Usability: No friction found')).toBeTruthy();
    });

    it('does not list generation_params', async () => {
      const candidates = await runWith((id, write) => {
        write(id, 'candidate-a', { status: 'success' }, { temperature: '0.4', seed: '7' });
      });
      renderCandidates(candidates);

      expect(screen.queryByText('params')).toBeNull();
      expect(screen.queryByText('temperature: 0.4')).toBeNull();
    });

    it('opens the lightbox from the thumbnail without toggling the selection', async () => {
      const candidates = await runWith((id, write) => write(id, 'candidate-a'));
      const onToggle = vi.fn();
      const user = userEvent.setup();
      renderCandidates(candidates, { selectable: true, onToggle });

      await user.click(screen.getByRole('button', { name: 'Open preview of candidate-a' }));
      expect(await screen.findByRole('dialog')).toBeTruthy();
      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('a candidate that could not be rendered', () => {
    it('is a tinted tile with a warning placeholder, its id and the reason, and no captured_at, preview or Select', async () => {
      const candidates = await runWith((id, write) => {
        write(id, 'candidate-a');
        write(id, 'candidate-c', { status: 'failed', reason: 'render timed out' });
      });
      renderCandidates(candidates, { selectable: true });

      const tile = screen.getByText('render timed out').closest('.candidate-card') as HTMLElement;
      expect(tile.textContent).toContain('candidate-c');
      expect(tile.textContent).not.toContain('2026-09-25');
      expect(tile.className).toContain('bg-destructive-surface');
      expect(tile.querySelector('.border-dashed')).not.toBeNull();
      expect(screen.getByText('render timed out').className).toContain('text-destructive');
      expect(within(tile).queryByRole('button')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Open preview of candidate-c' })).toBeNull();
      expect(screen.queryByRole('button', { name: /Select(ed)? candidate-c/ })).toBeNull();
    });
  });

  describe('choosing', () => {
    it('offers a Select toggle per candidate only while selectable, and reports the click', async () => {
      const candidates = await runWith((id, write) => {
        write(id, 'candidate-a');
        write(id, 'candidate-b');
      });
      const onToggle = vi.fn();
      const user = userEvent.setup();
      const view = renderCandidates(candidates, { selectable: false, onToggle });
      expect(screen.queryByRole('button', { name: /^Select/ })).toBeNull();

      await view.rerender({ candidates, selectable: true, onToggle });
      expect(selectButton('candidate-a').getAttribute('aria-pressed')).toBe('false');
      expect(selectButton('candidate-a').textContent).toContain('Select');
      await user.click(selectButton('candidate-b'));
      expect(onToggle.mock.calls).toEqual([['candidate-b']]);
    });

    it('shows a selected candidate as pressed and Selected', async () => {
      const candidates = await runWith((id, write) => {
        write(id, 'candidate-a');
        write(id, 'candidate-b');
      });
      renderCandidates(candidates, { selectable: true, selected: ['candidate-a'] });

      expect(selectButton('candidate-a').getAttribute('aria-pressed')).toBe('true');
      expect(selectButton('candidate-a').textContent).toContain('Selected');
      expect(selectButton('candidate-b').getAttribute('aria-pressed')).toBe('false');
    });

    it('marks the approved candidates Chosen, with no Select toggle once the decision is made', async () => {
      const candidates = await runWith((id, write) => {
        write(id, 'candidate-a');
        write(id, 'candidate-b');
      });
      renderCandidates(candidates, { chosen: ['candidate-b'] });

      const badges = screen.getAllByText('Chosen');
      expect(badges).toHaveLength(1);
      expect(badges[0].closest('.candidate-card')?.textContent).toContain('candidate-b');
      expect(screen.queryByRole('button', { name: /^Select/ })).toBeNull();
    });
  });

  describe('notes', () => {
    it('opens a labelled textarea from Add a Note… and reports typing', async () => {
      const candidates = await runWith((id, write) => write(id, 'candidate-a'));
      const onNote = vi.fn();
      const user = userEvent.setup();
      renderCandidates(candidates, { selectable: true, onNote });

      expect(screen.queryByLabelText('Note for candidate-a')).toBeNull();
      await user.click(screen.getByRole('button', { name: 'Add a Note…' }));
      await user.type(screen.getByLabelText('Note for candidate-a'), 'hi');

      expect(onNote).toHaveBeenLastCalledWith('candidate-a', 'hi');
    });

    it('lightens the Add a Note… link in dark mode, where the primary pink is only 3.1:1 on the card', async () => {
      const candidates = await runWith((id, write) => write(id, 'candidate-a'));
      renderCandidates(candidates, { selectable: true });

      expect(screen.getByRole('button', { name: 'Add a Note…' })).toHaveClass('dark:text-primary-subtle-foreground');
    });

    it('toggles the note editor from one link: Add a Note…, Hide Note, Edit Note', async () => {
      const candidates = await runWith((id, write) => write(id, 'candidate-a'));
      const user = userEvent.setup();
      renderCandidates(candidates, { selectable: true });

      await user.click(screen.getByRole('button', { name: 'Add a Note…' }));
      expect(screen.getByRole('button', { name: 'Hide Note' })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByLabelText('Note for candidate-a').getAttribute('placeholder')).toBe(
        'Notes to steer the next round (optional)'
      );
      await user.click(screen.getByRole('button', { name: 'Hide Note' }));
      expect(screen.queryByLabelText('Note for candidate-a')).toBeNull();
    });

    it('reads a saved note as "Your note: …" once the editor is closed, and can edit it again', async () => {
      const candidates = await runWith((id, write) => write(id, 'candidate-a'));
      const user = userEvent.setup();
      renderCandidates(candidates, { selectable: true, notes: { 'candidate-a': 'keep the header' } });

      expect(screen.getByText('Your note: keep the header')).toBeTruthy();
      expect(screen.queryByLabelText('Note for candidate-a')).toBeNull();
      await user.click(screen.getByRole('button', { name: 'Edit Note' }));
      expect((screen.getByLabelText('Note for candidate-a') as HTMLTextAreaElement).value).toBe('keep the header');
      await user.click(screen.getByRole('button', { name: 'Hide Note' }));
      expect(screen.queryByLabelText('Note for candidate-a')).toBeNull();
      expect(screen.getByText('Your note: keep the header')).toBeTruthy();
    });

    it('offers no way to add a note once it is not selectable', async () => {
      const candidates = await runWith((id, write) => write(id, 'candidate-a'));
      renderCandidates(candidates, { selectable: false });

      expect(screen.queryByRole('button', { name: /Note/ })).toBeNull();
    });
  });
});
