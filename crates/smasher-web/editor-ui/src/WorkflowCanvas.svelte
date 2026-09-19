<svelte:options customElement={{ tag: 'workflow-canvas', shadow: 'none' }} />

<script lang="ts">
  import WorkflowCanvasInner from './WorkflowCanvasInner.svelte';
  import { createGraph, saveGraph } from './api';
  import type { EditorGraph } from './types';

  // `graph` is set imperatively as a JS property from host-page script
  // (`document.querySelector('workflow-canvas').graph = {...}`), not an
  // HTML attribute -- WorkflowCanvasInner's own $effect turns that into
  // canvas state. This shell only does host-integration: bridging that
  // property, calling the real save/create APIs, and dispatching the
  // `workflow-saved` CustomEvent back out across the custom-element
  // boundary (`composed: true` is required for that, or the event never
  // reaches anything outside this element -- spec's flagged risk).
  //
  // `availableTargetDirs` (follow-up to Task 5, approved by Jobsworth): the
  // list of configured workflow directories, bootstrapped the same way
  // `graph`/`workflowId` are -- only used by WorkflowCanvasInner's
  // create-mode name/target-dir form when `workflowId` is unset.
  let { graph = $bindable(undefined), workflowId = undefined, availableTargetDirs = undefined }: {
    graph?: EditorGraph;
    workflowId?: string;
    availableTargetDirs?: string[];
  } = $props();

  let inner: ReturnType<typeof WorkflowCanvasInner> | undefined = $state();

  async function handleSave(current: EditorGraph, meta?: { name: string; targetDir: string }) {
    if (meta) {
      // Create mode: no file exists yet, so POST a new one instead of
      // PUTing to an id that doesn't exist. Mirrors create_workflow's own
      // "write, then redirect to the new page" pattern (routes/pages.rs) --
      // client-side navigation here since this is a custom element with no
      // server round-trip for the page itself.
      const created = await createGraph(current, meta.targetDir, meta.name);
      $host().dispatchEvent(new CustomEvent('workflow-saved', { detail: created, bubbles: true, composed: true }));
      window.location.href = `/workflows/${encodeURIComponent(created.id)}/edit`;
      return;
    }
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

<WorkflowCanvasInner bind:this={inner} {graph} {workflowId} {availableTargetDirs} onSave={handleSave} />
