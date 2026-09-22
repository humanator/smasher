// ABOUTME: Svelte context key/type shared between WorkflowCanvasInner.svelte
// ABOUTME: (sets it) and WorkflowNode.svelte (reads it) for handle ordering.

// Determines which handle pair (top/bottom vs left/right) a loaded edge with
// no explicit sourceHandle/targetHandle resolves to: @xyflow/system's own
// getHandle always picks the first-registered handle of the needed type when
// no id is given ("if no handleId is given, we use the first handle"), so
// WorkflowNode.svelte has to know the graph's actual flow direction to put
// the matching pair first -- otherwise every old/implicit edge would render
// off the wrong side regardless of where the nodes actually sit relative to
// each other. A single reactive ($state) object set once via setContext,
// same "live, not a snapshot" reasoning as edgeContext.ts's
// WorkflowEdgeActions -- if a future graph_attrs-editing UI ever lets a
// human flip rankdir after a graph's already loaded, already-mounted nodes
// pick that up instead of needing a remount.
export const FLOW_DIRECTION_CONTEXT_KEY = 'workflow-flow-direction';

export interface FlowDirection {
  rankdir: string;
}
