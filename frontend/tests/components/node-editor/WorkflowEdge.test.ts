// ABOUTME: Tests for WorkflowEdge.svelte: smoothstep path, loop styling, label pills and selection
// ABOUTME: Also covers connectionName, the accessible name shared by the edge and its label pill

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { Edge } from '@xyflow/svelte';
import EdgeHost from './EdgeHost.svelte';
import { connectionName } from '../../../src/components/node-editor/edgeContext';

function edge(overrides: Partial<Edge> = {}, loopRestart = false): Edge {
  return { id: 'a->b#0', source: 'a', target: 'b', type: 'workflow', data: { loopRestart, attrs: {} }, ...overrides };
}

async function renderEdge(e: Edge) {
  const onSelectEdge = vi.fn();
  const result = render(EdgeHost, { props: { initialEdges: [e], onSelectEdge } });
  await waitFor(() => expect(document.querySelector('.svelte-flow__edge-path')).not.toBeNull());
  return { ...result, onSelectEdge };
}

describe('connectionName', () => {
  it('names a connection by its two steps', () => {
    expect(connectionName('Draft', 'Check')).toBe('Connection from Draft to Check');
  });

  it('adds the label when there is one', () => {
    expect(connectionName('Draft', 'Check', 'retry')).toBe('Connection from Draft to Check, labelled retry');
    expect(connectionName('Draft', 'Check', '')).toBe('Connection from Draft to Check');
  });
});

describe('WorkflowEdge', () => {
  it('draws a smoothstep path (straight runs and rounded corners, no bezier curves)', async () => {
    await renderEdge(edge());
    const d = document.querySelector('.svelte-flow__edge-path')!.getAttribute('d')!;
    expect(d).toMatch(/L/);
    expect(d).not.toMatch(/C/);
  });

  it('styles a loop connection as a loop', async () => {
    await renderEdge(edge({}, true));
    expect(document.querySelector('.svelte-flow__edge-path')).toHaveClass('wf-edge-loop');
  });

  it('does not style a normal connection as a loop', async () => {
    await renderEdge(edge());
    expect(document.querySelector('.svelte-flow__edge-path')).not.toHaveClass('wf-edge-loop');
  });

  it('shows the label as a pill named after the connection', async () => {
    await renderEdge(edge({ label: 'retry' }));
    const pill = screen.getByRole('button', { name: 'Connection from Draft to Check, labelled retry' });
    expect(pill).toHaveTextContent('retry');
    expect(pill).toHaveClass('wf-edge-label');
    expect(pill).not.toHaveClass('wf-edge-label-loop');
  });

  it('gives a loop label the loop pill variant, in the warning ink', async () => {
    await renderEdge(edge({ label: 'try again' }, true));
    const pill = screen.getByRole('button', { name: /labelled try again/ });
    expect(pill).toHaveClass('wf-edge-label-loop', 'text-warning-foreground', 'border-warning-foreground');
    expect(pill.className).not.toMatch(/kind-human/);
  });

  it('restyles as a loop, and back, when Go back and redo is toggled', async () => {
    const { component } = await renderEdge(edge({ label: 'retry' }));
    const path = () => document.querySelector('.svelte-flow__edge-path');

    component.setEdges([edge({ label: 'retry' }, true)]);
    await waitFor(() => expect(path()).toHaveClass('wf-edge-loop'));
    expect(screen.getByRole('button', { name: /labelled retry/ })).toHaveClass('wf-edge-label-loop');

    component.setEdges([edge({ label: 'retry' }, false)]);
    await waitFor(() => expect(path()).not.toHaveClass('wf-edge-loop'));
  });

  it('has no pill when the connection has no label', async () => {
    await renderEdge(edge());
    expect(screen.queryByRole('button', { name: /Connection from/ })).toBeNull();
  });

  it('selects the connection when its label is clicked', async () => {
    const { onSelectEdge } = await renderEdge(edge({ label: 'retry' }));
    await fireEvent.click(screen.getByRole('button', { name: /labelled retry/ }));

    expect(onSelectEdge).toHaveBeenCalledWith('a->b#0');
    await waitFor(() => expect(document.querySelector('.svelte-flow__edge')).toHaveClass('selected'));
    expect(screen.getByRole('button', { name: /labelled retry/ })).toHaveClass('wf-edge-label-selected');
  });

  it('has no delete button, even when selected', async () => {
    await renderEdge(edge({ label: 'retry' }));
    await fireEvent.click(screen.getByRole('button', { name: /labelled retry/ }));
    await waitFor(() => expect(document.querySelector('.svelte-flow__edge')).toHaveClass('selected'));
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
    expect(document.querySelector('[data-testid^="edge-delete-"]')).toBeNull();
  });

  it('is deleted with Backspace once selected', async () => {
    const { component } = await renderEdge(edge({ label: 'retry' }));
    await fireEvent.click(screen.getByRole('button', { name: /labelled retry/ }));
    await waitFor(() => expect(document.querySelector('.svelte-flow__edge')).toHaveClass('selected'));

    await fireEvent.keyDown(document, { key: 'Backspace' });

    await waitFor(() => expect(component.currentEdges()).toHaveLength(0));
  });
});
