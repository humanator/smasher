// ABOUTME: Svelte context key/type shared between WorkflowCanvasInner.svelte
// ABOUTME: (sets it) and WorkflowEdge.svelte (reads it) for hover + delete.

// WorkflowEdge.svelte is instantiated by @xyflow/svelte's internal
// EdgeRenderer/EdgeWrapper, not directly in WorkflowCanvasInner.svelte's own
// markup, so it can't receive `onedgepointerenter`/a delete callback as an
// ordinary prop the way nodeForms/*.svelte receive `onChange` -- Svelte
// Flow's custom `edgeTypes` components have a fixed prop shape (EdgeProps)
// with only `data` as a generic passthrough. Context is the standard
// Svelte-Flow-recommended escape hatch for exactly this (a delete/hover
// affordance rendered inside a custom edge). `hoveredEdgeId` is a field on a
// single reactive ($state) object created once in WorkflowCanvasInner and
// passed by reference via setContext, rather than a bare primitive -- a
// primitive read via getContext would not stay live as WorkflowCanvasInner
// updates it (Svelte 5 reactivity requires the reactive proxy itself to
// cross the context boundary, not a value snapshot of it).
export const EDGE_ACTIONS_CONTEXT_KEY = 'workflow-edge-actions';

export interface WorkflowEdgeActions {
  hoveredEdgeId: string | null;
  onDeleteEdge: (edgeId: string) => void;
}
