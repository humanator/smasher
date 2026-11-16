// ABOUTME: Tests for DecisionBar, the run page's pinned bar for a waiting gallery gate
// ABOUTME: Presentational: the edges, selection and submit state come in as props; the real gate is covered in RunPage.test

import type { ComponentProps } from 'svelte';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import DecisionBar from '../../../src/components/run/DecisionBar.svelte';

type Props = ComponentProps<typeof DecisionBar>;

function renderBar(props: Partial<Props> = {}) {
  const onDecide = vi.fn();
  const view = render(DecisionBar, {
    props: { edges: ['iterate', 'approve'], selected: [], onDecide, ...props },
  });
  return { ...view, onDecide };
}

const bar = () => screen.getByRole('region', { name: 'Decision' });
// bits-ui's tooltip content carries no ARIA role, so it is found by its slot.
const tooltip = () =>
  waitFor(() => {
    const content = document.querySelector<HTMLElement>('[data-slot="tooltip-content"]');
    if (!content) throw new Error('tooltip not open');
    return content;
  });
const approve = () => within(bar()).getByRole('button', { name: 'Approve Selected' });
const tryAgain = () => within(bar()).getByRole('button', { name: 'Try Again with My Notes' });

describe('DecisionBar', () => {
  describe('the words', () => {
    it('is a labelled Decision region that asks what should happen next', () => {
      renderBar();

      expect(within(bar()).getByText('What should happen next?')).toBeTruthy();
    });

    it('is a full-width bar on the muted surface with only a top border, not a rounded card', () => {
      renderBar();

      expect(bar()).toHaveClass('bg-muted', 'border-t');
      expect(bar().className).not.toMatch(/rounded|sm:border(?!-)/);
    });

    it('says nothing is selected yet, with what to do', () => {
      renderBar();

      expect(within(bar()).getByText('Nothing selected yet. Select the candidates you want to keep.')).toBeTruthy();
    });

    it('lists what is selected', () => {
      renderBar({ selected: ['concept-a', 'concept-b'] });

      expect(within(bar()).getByText('2 selected: concept-a, concept-b')).toBeTruthy();
    });

    it('explains each button in a tooltip that opens on focus', async () => {
      const user = userEvent.setup();
      renderBar({ edges: ['iterate', 'skip', 'approve'] });

      await user.tab();
      const info = within(bar()).getByRole('button', { name: 'What the buttons do' });
      expect(document.activeElement).toBe(info);
      const tip = await tooltip();
      expect(tip.textContent).toContain('Try Again with My Notes');
      expect(tip.textContent).toContain('Skip');
      expect(tip.textContent).toContain('Approve Selected');
    });

    it('leaves a button out of the tooltip when the gate has no such edge', async () => {
      const user = userEvent.setup();
      renderBar({ edges: ['approve'] });

      await user.tab();
      const tip = await tooltip();
      expect(tip.textContent).toContain('Approve Selected');
      expect(tip.textContent).not.toContain('Try Again');
    });
  });

  describe('the buttons come from the gate\'s edges', () => {
    it('shows Try Again with My Notes (outline) and Approve Selected for iterate and approve', () => {
      renderBar();

      expect(tryAgain()).toBeTruthy();
      expect(approve()).toBeTruthy();
      expect(within(bar()).getAllByRole('button').filter((b) => b.getAttribute('aria-label') === null)).toHaveLength(2);
    });

    it('shows only what the gate offers', () => {
      renderBar({ edges: ['approve'] });

      expect(approve()).toBeTruthy();
      expect(within(bar()).queryByRole('button', { name: 'Try Again with My Notes' })).toBeNull();
    });

    it('shows any other edge as an extra outline button beside the two', () => {
      renderBar({ edges: ['iterate', 'skip', 'approve'], selected: ['concept-a'] });

      const extra = within(bar()).getByRole('button', { name: 'Skip' });
      expect(extra).toBeTruthy();
      expect(extra.className).not.toContain('bg-primary ');
      expect(tryAgain()).toBeTruthy();
      expect(approve()).toBeTruthy();
    });

    it('sends the edge the gate spelled when a button is pressed', async () => {
      const user = userEvent.setup();
      const { onDecide } = renderBar({ edges: ['iterate', 'Skip', 'approve'], selected: ['concept-a'] });

      await user.click(within(bar()).getByRole('button', { name: 'Skip' }));
      await user.click(tryAgain());
      await user.click(approve());

      expect(onDecide.mock.calls).toEqual([['Skip'], ['iterate'], ['approve']]);
    });
  });

  describe('selection', () => {
    it('disables Approve Selected while nothing is selected, and Try Again stays available', async () => {
      const user = userEvent.setup();
      const { onDecide } = renderBar({ selected: [] });

      expect((approve() as HTMLButtonElement).disabled).toBe(true);
      expect((tryAgain() as HTMLButtonElement).disabled).toBe(false);
      await user.click(approve());
      expect(onDecide).not.toHaveBeenCalled();
    });

    it('enables Approve Selected once something is selected', () => {
      renderBar({ selected: ['concept-a'] });

      expect((approve() as HTMLButtonElement).disabled).toBe(false);
    });

    it('treats a proceed edge as the approve button, needing a selection', async () => {
      const user = userEvent.setup();
      const { onDecide } = renderBar({ edges: ['iterate', 'proceed'], selected: [] });

      expect((approve() as HTMLButtonElement).disabled).toBe(true);
      expect(within(bar()).queryByRole('button', { name: 'Proceed' })).toBeNull();
      await user.click(approve());
      expect(onDecide).not.toHaveBeenCalled();
    });

    it('sends proceed as the gate spelled it when a selection exists', async () => {
      const user = userEvent.setup();
      const { onDecide } = renderBar({ edges: ['iterate', 'proceed'], selected: ['concept-a'] });

      await user.click(approve());

      expect(onDecide.mock.calls).toEqual([['proceed']]);
    });

    it('keeps other edges available with nothing selected (only the approve edge needs a selection)', () => {
      renderBar({ edges: ['skip'], selected: [] });

      expect((within(bar()).getByRole('button', { name: 'Skip' }) as HTMLButtonElement).disabled).toBe(false);
    });
  });

  describe('submitting', () => {
    it('disables every button while a decision is being sent', () => {
      renderBar({ edges: ['iterate', 'skip', 'approve'], selected: ['concept-a'], submitting: true });

      for (const button of within(bar()).getAllByRole('button')) {
        if (button.getAttribute('aria-label') === 'What the buttons do') continue;
        expect((button as HTMLButtonElement).disabled).toBe(true);
      }
    });

    it('shows a failure inline in the bar as an alert, never a toast', async () => {
      renderBar({ error: 'comment for candidate-a exceeds 4000 characters' });

      const alert = within(bar()).getByRole('alert');
      expect(alert.textContent).toContain('exceeds 4000 characters');
      await waitFor(() => expect(document.querySelector('[data-sonner-toast]')).toBeNull());
    });

    it('shows no alert when there is no error', () => {
      renderBar();

      expect(within(bar()).queryByRole('alert')).toBeNull();
    });
  });

  describe('layout', () => {
    it('stacks at phone width, with full-width buttons, and pins itself to the bottom of the column', () => {
      renderBar();

      expect(bar().className).toContain('sticky');
      expect(bar().className).toContain('bottom-0');
      const row = approve().parentElement as HTMLElement;
      expect(row.className).toContain('flex-col');
      expect(row.className).toContain('sm:flex-row');
      expect(approve().className).toContain('w-full');
    });
  });
});
