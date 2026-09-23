<script lang="ts">
  // ABOUTME: SubPipeline node-kind side-panel form component
  // ABOUTME: Edits pipeline attribute (path to sub-pipeline .dot file)

  import { untrack } from 'svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import type { NodeFormProps } from '../types';

  // Grounded in composition.rs:199-206 (SubPipelineTransform::apply):
  // `pipeline`, a string path to another .dot file, resolved relative to
  // the composer's base directory. Missing entirely ->
  // CompositionError::MissingPipelineAttr, so an empty field here removes
  // the attr (surfacing that same missing-attr error at composition time)
  // rather than writing an empty-string path.
  let { attrs, onChange }: NodeFormProps = $props();
  const uid = $props.id();

  let pipeline = $state(untrack(() => (typeof attrs.pipeline === 'string' ? attrs.pipeline : '')));

  function handleInput(event: Event) {
    pipeline = (event.target as HTMLInputElement).value;
    onChange({ attrs: { pipeline: pipeline || undefined } });
  }
</script>

<div class="flex flex-col gap-3" data-testid="sub-pipeline-form">
  <div class="flex flex-col gap-1.5">
    <Label for="{uid}-pipeline">Pipeline file</Label>
    <Input
      id="{uid}-pipeline"
      type="text"
      data-testid="sub-pipeline-path"
      value={pipeline}
      oninput={handleInput}
      placeholder="e.g. examples/sub_flow.dot"
    />
  </div>
</div>
