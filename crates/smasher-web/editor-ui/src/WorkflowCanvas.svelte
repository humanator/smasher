<svelte:options customElement={{ tag: 'workflow-canvas', shadow: 'none' }} />

<script lang="ts">
  import WorkflowCanvasInner from './WorkflowCanvasInner.svelte';
  import { saveGraph } from './api';
  import type { EditorGraph } from './types';

  // `graph` is set imperatively as a JS property from host-page script
  // (`document.querySelector('workflow-canvas').graph = {...}`), not an
  // HTML attribute -- WorkflowCanvasInner's own $effect turns that into
  // canvas state. This shell only does host-integration: bridging that
  // property, calling the real save API, and dispatching the
  // `workflow-saved` CustomEvent back out across the custom-element
  // boundary (`composed: true` is required for that, or the event never
  // reaches anything outside this element -- spec's flagged risk).
  let { graph = $bindable(undefined), workflowId = undefined }: {
    graph?: EditorGraph;
    workflowId?: string;
  } = $props();

  let inner: ReturnType<typeof WorkflowCanvasInner> | undefined = $state();

  async function handleSave(current: EditorGraph) {
    if (!workflowId) {
      throw new Error('no workflowId set; cannot save');
    }
    const saved = await saveGraph(workflowId, current);
    $host().dispatchEvent(new CustomEvent('workflow-saved', { detail: saved, bubbles: true, composed: true }));
  }

  // Imperative escape hatch for host code (and tests) to read the current
  // graph -- e.g. after a user adds/deletes a node or edge via Svelte
  // Flow's own built-in canvas interactions.
  $effect(() => {
    Object.assign($host(), { getGraph: () => inner?.currentGraph() });
  });
</script>

<WorkflowCanvasInner bind:this={inner} {graph} onSave={handleSave} />
