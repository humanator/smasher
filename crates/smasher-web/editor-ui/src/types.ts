// Mirrors smasher-web's EditorGraph/EditorNode/EditorEdge JSON shape
// (crates/smasher-web/src/routes/editor_api.rs) -- kept as a hand-written
// type rather than generated, matching this task's scope (no codegen step
// introduced).

export type AttrValue = string | number | boolean;

// The exact capitalized strings smasher-attractor's NodeType enum
// round-trips through (graph/mod.rs's node_type_to_str/node_type_from_str,
// mirrored by smasher-web's editor_api.rs). EditorNode.node_type stays a
// plain `string` above -- an unrecognized/future value must not crash the
// canvas (see convert.ts's fallback rendering) -- but nodeConfig.ts's
// registry is keyed by this narrower union so TypeScript's exhaustiveness
// checking catches a missing visual-config entry at compile time.
export type NodeType =
  | 'Codergen'
  | 'Interviewer'
  | 'Tool'
  | 'Manager'
  | 'Conditional'
  | 'SubPipeline'
  | 'Start'
  | 'Exit'
  | 'Parallel'
  | 'FanIn';

export interface EditorNode {
  id: string;
  node_type: string;
  label: string | null;
  attrs: Record<string, AttrValue>;
}

export interface EditorEdge {
  from: string;
  to: string;
  label: string | null;
  condition: string | null;
  priority: number | null;
  loop_restart: boolean;
  attrs: Record<string, AttrValue>;
}

export interface EditorGraph {
  name: string | null;
  nodes: EditorNode[];
  edges: EditorEdge[];
  graph_attrs: Record<string, AttrValue>;
}
