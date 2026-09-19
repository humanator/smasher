<script lang="ts">
  import { untrack } from 'svelte';
  import './nodeForms.css';
  import type { NodeFormProps } from '../types';

  // Grounded in composition.rs:199-206 (SubPipelineTransform::apply):
  // `pipeline`, a string path to another .dot file, resolved relative to
  // the composer's base directory. Missing entirely ->
  // CompositionError::MissingPipelineAttr, so an empty field here removes
  // the attr (surfacing that same missing-attr error at composition time)
  // rather than writing an empty-string path.
  let { attrs, onChange }: NodeFormProps = $props();

  let pipeline = $state(untrack(() => (typeof attrs.pipeline === 'string' ? attrs.pipeline : '')));

  function handleInput(event: Event) {
    pipeline = (event.target as HTMLInputElement).value;
    onChange({ attrs: { pipeline: pipeline || undefined } });
  }
</script>

<div class="node-form" data-testid="sub-pipeline-form">
  <label class="node-form-field">
    Pipeline file
    <input
      type="text"
      data-testid="sub-pipeline-path"
      value={pipeline}
      oninput={handleInput}
      placeholder="e.g. examples/sub_flow.dot"
    />
  </label>
</div>
