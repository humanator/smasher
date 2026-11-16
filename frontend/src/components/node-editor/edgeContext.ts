// ABOUTME: Svelte context key/type shared between WorkflowCanvasInner.svelte
// ABOUTME: (sets it) and WorkflowEdge.svelte (reads it) for selection + delete.

// WorkflowEdge.svelte is instantiated by @xyflow/svelte's internal
// EdgeRenderer/EdgeWrapper, not directly in WorkflowCanvasInner.svelte's own
// markup, so it can't receive a select/delete callback as an ordinary prop
// the way nodeForms/*.svelte receive `onChange` -- Svelte Flow's custom
// `edgeTypes` components have a fixed prop shape (EdgeProps) with only
// `data` as a generic passthrough. Context is the standard
// Svelte-Flow-recommended escape hatch for exactly this.
export const EDGE_ACTIONS_CONTEXT_KEY = 'workflow-edge-actions';

export interface WorkflowEdgeActions {
  /** A click on a label pill: the canvas shows that connection in the inspector. */
  onSelectEdge: (edgeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
}

/** The accessible name of a connection and its label pill. */
export function connectionName(from: string, to: string, label?: string | null): string {
  const name = `Connection from ${from} to ${to}`;
  return label ? `${name}, labelled ${label}` : name;
}
