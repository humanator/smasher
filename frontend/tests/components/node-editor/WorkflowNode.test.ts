// ABOUTME: Tests for WorkflowNode.svelte step cards: chip, kind, name, summary, Needs attention and handles
// ABOUTME: Rendered through WorkflowCanvas, since cards only exist inside a SvelteFlow

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import WorkflowCanvas from '../../../src/components/node-editor/WorkflowCanvas.svelte';
import type { EditorGraph } from '../../../src/components/node-editor/types';

const graph: EditorGraph = {
  name: 'Every kind',
  graph_attrs: {},
  nodes: [
    { id: 'start', node_type: 'Start', label: 'Begin', attrs: {} },
    { id: 'gen', node_type: 'Codergen', label: 'Draft', attrs: { prompt: 'Write three concepts' } },
    { id: 'mgr', node_type: 'Manager', label: 'Coordinate', attrs: {} },
    { id: 'tool', node_type: 'Tool', label: 'Check', attrs: {} },
    { id: 'cmd', node_type: 'Tool', label: 'Tests', attrs: { tool_command: 'npm test' } },
    { id: 'ask', node_type: 'Interviewer', label: 'Approve', attrs: { question: 'Ship it?', approve: 'true' } },
    { id: 'br', node_type: 'Conditional', label: 'Passed?', attrs: {} },
    { id: 'split', node_type: 'Parallel', label: 'Fan out', attrs: {} },
    { id: 'join', node_type: 'FanIn', label: 'Gather', attrs: {} },
    { id: 'sub', node_type: 'SubPipeline', label: 'Review', attrs: { pipeline: 'examples/review.dot' } },
    { id: 'end', node_type: 'Exit', label: 'Done', attrs: {} },
  ],
  edges: [
    { from: 'br', to: 'gen', loop_restart: false, attrs: {} },
    { from: 'br', to: 'end', loop_restart: false, attrs: {} },
  ],
};

function nodeEl(id: string): HTMLElement {
  return document.querySelector(`.svelte-flow__node[data-id="${id}"]`) as HTMLElement;
}

async function renderGraph() {
  const result = render(WorkflowCanvas, { props: { graph, onSave: vi.fn() } });
  await waitFor(() => expect(screen.getByText('Begin')).toBeInTheDocument());
  return result;
}

describe('step cards', () => {
  it.each([
    ['gen', 'AI Agent', 'Write three concepts'],
    ['mgr', 'AI Coordinator', 'No task yet'],
    ['tool', 'Tool', 'Choose a tool'],
    ['cmd', 'Tool', '$ npm test'],
    ['ask', 'Ask a person', 'Yes or no · Ship it?'],
    ['br', 'Branch', '2 paths out'],
    ['sub', 'Nested workflow', 'examples/review.dot'],
  ])('%s renders a card with its chip, kind and summary', async (id, kind, summary) => {
    await renderGraph();
    const card = nodeEl(id).querySelector('.wf-card') as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.querySelector('.wf-chip svg')).not.toBeNull();
    expect(within(card).getByText(kind)).toHaveClass('wf-kind');
    expect(within(card).getByText(summary)).toHaveClass('wf-summary');
  });

  it.each([
    ['split', 'Split'],
    ['join', 'Join'],
  ])('%s renders a card with its kind and no summary', async (id, kind) => {
    await renderGraph();
    const card = nodeEl(id).querySelector('.wf-card') as HTMLElement;
    expect(within(card).getByText(kind)).toHaveClass('wf-kind');
    expect(card.querySelector('.wf-summary')).toBeNull();
  });

  it.each(['start', 'end'])('%s renders as a pill with its chip and name', async (id) => {
    await renderGraph();
    const pill = nodeEl(id).querySelector('.wf-pill') as HTMLElement;
    expect(pill).not.toBeNull();
    expect(nodeEl(id).querySelector('.wf-card')).toBeNull();
    expect(pill.querySelector('.wf-chip svg')).not.toBeNull();
    expect(within(pill).getByText(id === 'start' ? 'Begin' : 'Done')).toHaveClass('wf-name');
  });

  it('names each card "{kind}: {name}"', async () => {
    await renderGraph();
    expect(nodeEl('gen')).toHaveAttribute('aria-label', 'AI Agent: Draft');
    expect(nodeEl('start')).toHaveAttribute('aria-label', 'Start: Begin');
    expect(nodeEl('end')).toHaveAttribute('aria-label', 'Finish: Done');
  });

  it('shows Needs attention on a step with a problem, and says so in its name', async () => {
    await renderGraph();
    expect(within(nodeEl('tool')).getByText('Needs attention')).toBeInTheDocument();
    expect(nodeEl('tool')).toHaveAttribute('aria-label', 'Tool: Check, needs attention');
    expect(within(nodeEl('gen')).queryByText('Needs attention')).toBeNull();
  });

  it('updates the summary and badge as the step is edited', async () => {
    await renderGraph();
    await fireEvent.click(nodeEl('cmd'));
    await fireEvent.input(screen.getByTestId('tool-command'), { target: { value: 'make lint' } });
    await waitFor(() => expect(within(nodeEl('cmd')).getByText('$ make lint')).toBeInTheDocument());
    expect(nodeEl('cmd')).toHaveAttribute('aria-label', 'Tool: Tests');

    // ToolForm clears a blank command, which leaves a Tool with nothing to run.
    await fireEvent.input(screen.getByTestId('tool-command'), { target: { value: '' } });
    await waitFor(() => expect(within(nodeEl('cmd')).getByText('Choose a tool')).toBeInTheDocument());
    expect(nodeEl('cmd')).toHaveAttribute('aria-label', 'Tool: Tests, needs attention');
    expect(within(nodeEl('cmd')).getByText('Needs attention')).toBeInTheDocument();
  });

  it('falls back to a generic card for an unknown kind', async () => {
    render(WorkflowCanvas, {
      props: {
        graph: { graph_attrs: {}, nodes: [{ id: 'm', node_type: 'FromTheFuture', label: 'Mystery', attrs: {} }], edges: [] },
        onSave: vi.fn(),
      },
    });
    await waitFor(() => expect(screen.getByText('Mystery')).toBeInTheDocument());
    expect(nodeEl('m')).toHaveAttribute('aria-label', 'Step: Mystery');
  });
});

describe('handles', () => {
  it('are present on every card but not marked live at rest', async () => {
    await renderGraph();
    const handles = nodeEl('gen').querySelectorAll('.svelte-flow__handle');
    expect(handles).toHaveLength(4);
    for (const handle of handles) {
      expect(handle).toHaveClass('wf-handle');
      expect(handle).not.toHaveClass('wf-handle-live');
    }
  });

  it('are hidden by the stylesheet until hover, focus, selection or a connection drag', () => {
    const css = readFileSync(join(process.cwd(), 'src/components/node-editor/WorkflowNode.css'), 'utf-8');
    expect(css).toMatch(/\.wf-handle\s*\{[^}]*opacity:\s*0;/);
    for (const reveal of [
      '.svelte-flow__node:hover .wf-handle',
      '.svelte-flow__node:focus-within .wf-handle',
      '.svelte-flow__node.selected .wf-handle',
      '.wf-handle.wf-handle-live',
    ]) {
      expect(css).toContain(reveal);
    }
  });

  it('put the pair that matches a left-to-right rankdir first', async () => {
    render(WorkflowCanvas, {
      props: { graph: { ...graph, graph_attrs: { rankdir: 'LR' } }, onSave: vi.fn() },
    });
    await waitFor(() => expect(screen.getByText('Begin')).toBeInTheDocument());
    const ids = Array.from(nodeEl('gen').querySelectorAll('[data-handleid]')).map((el) => el.getAttribute('data-handleid'));
    expect(ids[0]).toBe('right');
  });
});

describe('selection', () => {
  it('marks the selected card, which the stylesheet rings in the accent', async () => {
    await renderGraph();
    await fireEvent.click(nodeEl('gen'));
    expect(nodeEl('gen')).toHaveClass('selected');

    const css = readFileSync(join(process.cwd(), 'src/components/node-editor/WorkflowNode.css'), 'utf-8');
    expect(css).toMatch(/\.svelte-flow__node\.selected \.wf-card[^{]*\{[^}]*var\(--primary\)/);
  });
});

describe('node-editor tokens', () => {
  const dir = join(process.cwd(), 'src/components/node-editor');
  const files = (d: string): string[] =>
    readdirSync(d).flatMap((name) => {
      const path = join(d, name);
      return statSync(path).isDirectory() ? files(path) : /\.(svelte|ts|css)$/.test(name) ? [path] : [];
    });
  // Comments may quote a board value; only code counts.
  const code = (s: string) =>
    s
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('has no hex colours in any node-editor file', () => {
    const offenders = files(dir).filter((path) => /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/.test(code(readFileSync(path, 'utf-8'))));
    expect(offenders).toEqual([]);
  });
});
