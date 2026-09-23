<script lang="ts">
  // ABOUTME: Structural node-kind side-panel form component (fallback for unrecognized kinds)
  // ABOUTME: Displays hint that no kind-specific attributes are available

  import type { NodeFormProps } from '../types';

  // Used for Start/Exit/Parallel/FanIn/Conditional, plus (via
  // WorkflowCanvasInner's formComponentFor fallback) any unrecognized or
  // future node_type string. None of these carry kind-specific attrs in any
  // real handler: node_type_from_shape (graph/mod.rs:198-211) derives the
  // kind purely from `shape`, and ConditionalHandler itself reads nothing --
  // `condition` lives on the *edge*, not the node (handler.rs:161-184). The
  // props below match every other nodeForms/*.svelte component's shape for
  // a uniform dynamic-render call site, but are intentionally unused here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { attrs: _attrs, onChange: _onChange }: NodeFormProps = $props();
</script>

<div class="flex flex-col gap-3" data-testid="structural-form">
  <p class="m-0 text-xs text-muted-foreground">This node kind has no additional fields beyond its label.</p>
</div>
