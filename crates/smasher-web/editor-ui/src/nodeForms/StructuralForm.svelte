<script lang="ts">
  import './nodeForms.css';
  import type { NodeFormProps } from '../types';

  // Used for Start/Exit/Parallel/FanIn/Conditional, plus (via
  // WorkflowCanvasInner's formComponentFor fallback) any unrecognized or
  // future node_type string. None of these carry kind-specific attrs in any
  // real handler: node_type_from_shape (graph/mod.rs:198-211) derives the
  // kind purely from `shape`, and ConditionalHandler itself reads nothing --
  // `condition` lives on the *edge*, not the node (handler.rs:161-184). The
  // props below match every other nodeForms/*.svelte component's shape for
  // a uniform dynamic-render call site, but are intentionally unused here.
  let { attrs: _attrs, onChange: _onChange }: NodeFormProps = $props();
</script>

<div class="node-form" data-testid="structural-form">
  <p class="node-form-hint">This node kind has no additional fields beyond its label.</p>
</div>
