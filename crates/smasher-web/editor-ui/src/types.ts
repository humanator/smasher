// Mirrors smasher-web's EditorGraph/EditorNode/EditorEdge JSON shape
// (crates/smasher-web/src/routes/editor_api.rs) -- kept as a hand-written
// type rather than generated, matching this task's scope (no codegen step
// introduced).

export type AttrValue = string | number | boolean;

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
