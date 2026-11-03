// ABOUTME: Tests for Palette.svelte, the step library: groups, search, selection and the drag payload
// ABOUTME: Groups and copy come from stepKinds (STEP_GROUPS), so these check the board's names and order

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import Palette from '../../../src/components/node-editor/Palette.svelte';
import { NODE_DRAG_DATA_TYPE, NODE_KIND_CONFIG } from '../../../src/components/node-editor/nodeConfig';
import { STEP_GROUPS } from '../../../src/lib/stepKinds';

function renderPalette(selected: string | null = null) {
  const onSelect = vi.fn();
  render(Palette, { props: { selected, onSelect } });
  return onSelect;
}

const library = () => screen.getByRole('complementary', { name: 'Step library' });
const item = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}\\b`) });
const groupTitles = () => within(library()).queryAllByRole('heading').map((h) => h.textContent);
const search = (value: string) => fireEvent.input(screen.getByRole('searchbox', { name: 'Search steps' }), { target: { value } });

describe('Palette (step library)', () => {
  it('is the Step library aside, with the hint', () => {
    renderPalette();
    expect(library()).toBeInTheDocument();
    expect(
      screen.getByText(
        'Drag a step onto the canvas. Select one here to read what it does and what each of its settings means.',
      ),
    ).toBeInTheDocument();
  });

  it('lists the STEP_GROUPS in board order, with no collapse toggles', () => {
    renderPalette();
    expect(groupTitles()).toEqual(['AI steps', 'Tools and checks', 'People', 'Flow', 'Start and finish']);
    expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(0);
    expect(screen.queryAllByRole('button', { expanded: false })).toHaveLength(0);
  });

  it('lists every node-editor kind exactly once, under its group', () => {
    renderPalette();
    const listed = STEP_GROUPS.flatMap((g) => g.kinds);
    expect([...listed].sort()).toEqual(Object.keys(NODE_KIND_CONFIG).sort());
    expect(new Set(listed).size).toBe(listed.length);
    const flow = screen.getByRole('heading', { name: 'Flow' }).closest('section')!;
    expect(within(flow).getAllByRole('button').map((b) => b.getAttribute('data-testid'))).toEqual([
      'palette-entry-Conditional',
      'palette-entry-Parallel',
      'palette-entry-FanIn',
      'palette-entry-SubPipeline',
    ]);
  });

  it('shows each step as a button with its chip, plain name and blurb', () => {
    renderPalette();
    const agent = screen.getByTestId('palette-entry-Codergen');
    expect(agent.tagName).toBe('BUTTON');
    expect(agent).toHaveAttribute('aria-pressed', 'false');
    expect(agent.querySelector('svg')).not.toBeNull();
    expect(within(agent).getByText('AI Agent')).toBeInTheDocument();
    expect(within(agent).getByText('Gives an AI model a brief and lets it do the work.')).toBeInTheDocument();
    expect(within(screen.getByTestId('palette-entry-Exit')).getByText('Finish')).toBeInTheDocument();
  });

  it('keeps every step draggable with the same drag payload', async () => {
    renderPalette();
    const entry = screen.getByTestId('palette-entry-Codergen');
    expect(entry).toHaveAttribute('draggable', 'true');

    const setData = vi.fn();
    await fireEvent.dragStart(entry, { dataTransfer: { setData, effectAllowed: '' } as unknown as DataTransfer });

    expect(setData).toHaveBeenCalledWith(NODE_DRAG_DATA_TYPE, 'Codergen');
    expect(NODE_DRAG_DATA_TYPE).toBe('application/x-workflow-node-type');
  });

  it('searches plain names, case-insensitively, and hides groups with no matches', async () => {
    renderPalette();
    await search('AGENT');
    expect(item('AI Agent')).toBeInTheDocument();
    expect(screen.queryByTestId('palette-entry-Manager')).toBeNull();
    expect(groupTitles()).toEqual(['AI steps']);
  });

  it('searches technical names', async () => {
    renderPalette();
    await search('fan-in');
    expect(screen.getByTestId('palette-entry-FanIn')).toBeInTheDocument();
    expect(groupTitles()).toEqual(['Flow']);
  });

  it('searches blurbs', async () => {
    renderPalette();
    await search('same time');
    expect(screen.getByTestId('palette-entry-Parallel')).toBeInTheDocument();
    expect(screen.queryByTestId('palette-entry-FanIn')).toBeNull();
  });

  it('says so when nothing matches', async () => {
    renderPalette();
    await search('teleport');
    expect(screen.getByText('No steps match that search.')).toBeInTheDocument();
    expect(groupTitles()).toEqual([]);
  });

  it('selects a step when clicked', async () => {
    const onSelect = renderPalette();
    await fireEvent.click(screen.getByTestId('palette-entry-Tool'));
    expect(onSelect).toHaveBeenCalledWith('Tool');
  });

  it('marks the selected step pressed, and deselects it when clicked again', async () => {
    const onSelect = renderPalette('Tool');
    expect(screen.getByTestId('palette-entry-Tool')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('palette-entry-Codergen')).toHaveAttribute('aria-pressed', 'false');

    await fireEvent.click(screen.getByTestId('palette-entry-Tool'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
