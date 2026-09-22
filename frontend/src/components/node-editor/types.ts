// ABOUTME: Node-editor data model types
// ABOUTME: EditorNode/EditorEdge/EditorGraph imported from workflows API client; other types defined here

import type { EditorEdge, EditorGraph, EditorNode } from '$lib/api/workflows';

export type { EditorEdge, EditorGraph, EditorNode };

// AttrValue mirrors smasher-attractor's scalar attribute values
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

// Task 7 (node-kind form components): the `onChange` contract every
// nodeForms/*.svelte component shares. A key mapped to `undefined` means
// "delete this attr" (e.g. unchecking Interviewer's gallery toggle should
// remove `gallery` entirely, not leave a stale value behind) -- plain
// object-spread merging can't express deletion, so the side panel
// (WorkflowCanvasInner.svelte's applyNodeFormChange) applies each entry
// key-by-key instead of spreading. `label` is deliberately NOT part of
// this patch shape: it's common to every node kind (and is itself every
// handler's own fallback value -- Codergen's `prompt`, Tool's `tool`,
// Manager's `task`, Interviewer's `question` all fall back to it), so it's
// edited once via a shared field in the side panel, not duplicated across
// six per-kind forms.
export type NodeAttrsPatch = Record<string, AttrValue | undefined>;

// Wrapped in `{ attrs: ... }` (rather than passing NodeAttrsPatch directly)
// so the same callback shape extends cleanly to the shared side-panel Label
// field, which calls it with `{ label: ... }` instead -- one callback type,
// used identically by WorkflowCanvasInner.svelte's applyNodeFormChange
// whether the edit came from a per-kind form's attrs or the panel's own
// label input.
export interface NodeFormChange {
  label?: string;
  attrs?: NodeAttrsPatch;
}

export interface NodeFormProps {
  attrs: Record<string, AttrValue>;
  onChange: (patch: NodeFormChange) => void;
}

// Task 8 (edge polish + edge attrs form): the `onChange` contract EdgeForm.svelte
// uses. Unlike NodeFormChange/NodeAttrsPatch, these 3 attrs aren't folded into a
// generic attrs bag on the wire -- graph/mod.rs's resolve() (and this editor's
// convert.ts toFlowEdges/toEditorGraph) already model condition/priority/
// loop_restart as their own typed `EditorEdge` fields (see types.ts's EditorEdge
// above), not entries in `attrs`. So the patch shape mirrors that directly
// instead of reusing NodeAttrsPatch's "undefined deletes" convention: `condition`/
// `priority` are `| null` (matching EditorEdge's own Option<String>/Option<i32>
// nullability -- "clear the field" is expressed as an explicit `null`, not
// `undefined`, since these keys are never *missing* from the patch, only ever
// present with a value or null) and `loopRestart` is a plain boolean (loop_restart
// itself defaults to `false` server-side per graph/mod.rs's extract_loop_restart,
// never "absent").
export interface EdgeFormChange {
  condition?: string | null;
  priority?: number | null;
  loopRestart?: boolean;
}

export interface EdgeFormProps {
  condition: string | null;
  priority: number | null;
  loopRestart: boolean;
  onChange: (patch: EdgeFormChange) => void;
}
