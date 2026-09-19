import { afterEach, describe, expect, it } from 'vitest';
import './WorkflowCanvas.svelte';

// WorkflowCanvas.svelte (the <svelte:options customElement> shell) mounts
// its child component inside an async connectedCallback -- Svelte's own
// documented custom-element pattern (`await Promise.resolve()` before the
// first mount, to batch property sets). Both jsdom and happy-dom fail to
// carry that mount through correctly (jsdom: `getContext(...) can only be
// used during component initialisation`, thrown from @xyflow/svelte's
// SvelteFlow.svelte; happy-dom: no error, but no content ever mounts
// either) -- a genuine, reproducible gap in both DOM-simulation libraries'
// Custom Elements v1 fidelity, not a defect here. Confirmed real-browser
// correctness instead via a real Chromium instance driven by Playwright
// against `npm run dev`: the custom element registers, `.graph` renders
// the expected nodes, the save button is present, zero console/page
// errors. All of the actual canvas logic this shell delegates to
// (WorkflowCanvasInner.svelte) has full jsdom coverage in
// WorkflowCanvasInner.test.ts, which doesn't hit this gap at all since
// it's a plain component, not a custom element.
//
// This file covers only what jsdom *can* reliably verify: the element
// registers and property assignment doesn't throw.
describe('workflow-canvas custom element (jsdom-reliable subset)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('registers itself as a custom element', () => {
    expect(customElements.get('workflow-canvas')).toBeDefined();
  });

  it('accepts graph/workflowId property assignment without throwing', () => {
    const el = document.createElement('workflow-canvas') as HTMLElement & {
      graph?: unknown;
      workflowId?: string;
    };
    document.body.appendChild(el);

    expect(() => {
      el.graph = { name: null, graph_attrs: {}, nodes: [], edges: [] };
      el.workflowId = 'some-id';
    }).not.toThrow();
  });

  // Follow-up to Task 5, approved by Jobsworth: /workflows/new's bootstrap
  // script also sets `availableTargetDirs` so the create-mode name/dir form
  // (WorkflowCanvasInner) knows which directories are configured.
  it('accepts availableTargetDirs property assignment without throwing', () => {
    const el = document.createElement('workflow-canvas') as HTMLElement & {
      graph?: unknown;
      availableTargetDirs?: string[];
    };
    document.body.appendChild(el);

    expect(() => {
      el.graph = { name: null, graph_attrs: {}, nodes: [], edges: [] };
      el.availableTargetDirs = ['examples', 'other'];
    }).not.toThrow();
  });
});
