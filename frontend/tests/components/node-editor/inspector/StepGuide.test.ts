// ABOUTME: Tests for inspector/StepGuide.svelte, the Step guide a library pick opens: About sections,
// ABOUTME: "Settings in this step" (label, Required badge and help per field, Step name left out) and Add to Canvas

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import StepGuide from '../../../../src/components/node-editor/inspector/StepGuide.svelte';
import { stepFields } from '../../../../src/lib/stepFields';
import { STEP_GROUPS, stepKind } from '../../../../src/lib/stepKinds';

const HANDLERS = STEP_GROUPS.flatMap((g) => g.kinds);
const NO_SETTINGS = ['Start', 'Exit', 'Conditional'];

function settingsList() {
  return screen.getByRole('list', { name: 'Settings in this step' });
}

describe('StepGuide', () => {
  it.each(HANDLERS)('%s shows its About sections', (handler) => {
    render(StepGuide, { props: { handler, onAdd: vi.fn() } });

    for (const [heading, text] of stepKind(handler).about) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { name: 'Settings in this step' })).toBeInTheDocument();
  });

  it.each(HANDLERS.filter((h) => !NO_SETTINGS.includes(h)))('%s lists every setting but Step name, with its help', (handler) => {
    render(StepGuide, { props: { handler, onAdd: vi.fn() } });

    const expected = stepFields(handler).filter((f) => f.attr !== 'label');
    const items = within(settingsList()).getAllByRole('listitem');
    expect(items).toHaveLength(expected.length);
    expected.forEach((field, i) => {
      expect(items[i]).toHaveTextContent(field.label);
      expect(items[i]).toHaveTextContent(field.help);
    });
    expect(within(settingsList()).queryByText('Step name')).toBe(null);
  });

  it.each(NO_SETTINGS)('%s says it has no settings beyond its name', (handler) => {
    render(StepGuide, { props: { handler, onAdd: vi.fn() } });

    expect(screen.getByText('This step has no settings beyond its name.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Settings in this step' })).toBe(null);
  });

  it('badges Required settings and only those', () => {
    render(StepGuide, { props: { handler: 'Tool', onAdd: vi.fn() } });

    const items = within(settingsList()).getAllByRole('listitem');
    const badged = items.filter((item) => within(item).queryByText('Required')).map((item) => item.firstElementChild?.textContent?.replace('Required', '').trim());
    expect(badged).toEqual(['Tool', 'Command']);
  });

  it('leaves out the settings the engine does not read', () => {
    render(StepGuide, { props: { handler: 'Interviewer', onAdd: vi.fn() } });

    expect(within(settingsList()).queryByText(/Stop waiting after/)).toBe(null);
    expect(within(settingsList()).queryByText('Fallback answer')).toBe(null);
    expect(within(settingsList()).getByText('Show a gallery of candidates')).toBeInTheDocument();
  });

  it('ends with Add to Canvas, which adds the step', async () => {
    const onAdd = vi.fn();
    render(StepGuide, { props: { handler: 'Codergen', onAdd } });

    await fireEvent.click(screen.getByRole('button', { name: 'Add to Canvas' }));

    expect(onAdd).toHaveBeenCalledWith('Codergen');
  });
});
