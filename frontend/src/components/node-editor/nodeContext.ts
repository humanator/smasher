// ABOUTME: Svelte context key/type shared between WorkflowCanvas.svelte (sets it)
// ABOUTME: and WorkflowNode.svelte (reads it) for each step's problems and outgoing count.

// Same reason as edgeContext.ts: WorkflowNode.svelte is instantiated by
// @xyflow/svelte's NodeRenderer with a fixed prop shape, so graph-wide
// derived state reaches it through context. WorkflowCanvas passes an object
// of getters over its $derived values, so reads stay live.
export const NODE_STATE_CONTEXT_KEY = 'workflow-node-state';

export interface WorkflowNodeState {
  /** Problem messages per node id (workflowProblems), absent when a step has none. */
  readonly problemsByNode: Map<string, string[]>;
  /** Connections leaving each node id, for the Branch card's "{n} paths out". */
  readonly outgoingByNode: Map<string, number>;
}
