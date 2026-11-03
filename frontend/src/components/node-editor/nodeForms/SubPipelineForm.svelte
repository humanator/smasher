<script lang="ts">
  // ABOUTME: SubPipeline (Nested workflow) node-kind side-panel form component
  // ABOUTME: Edits the Workflow file (pipeline attribute, the path to a .dot file), with copy from stepFields

  import { untrack } from 'svelte';
  import { stepFields } from '$lib/stepFields';
  import { fieldProblem } from '$lib/workflowProblems';
  import Field from '../inspector/Field.svelte';
  import type { NodeFormProps } from '../types';

  // Grounded in composition.rs:199-206 (SubPipelineTransform::apply):
  // `pipeline`, a string path to another .dot file, resolved relative to
  // the composer's base directory. Missing entirely ->
  // CompositionError::MissingPipelineAttr, so an empty field here removes
  // the attr (surfacing that same missing-attr error at composition time)
  // rather than writing an empty-string path.
  let { attrs, onChange, problems = [] }: NodeFormProps = $props();

  const pipelineSpec = stepFields('SubPipeline').find((f) => f.attr === 'pipeline')!;

  let pipeline = $state(untrack(() => (typeof attrs.pipeline === 'string' ? attrs.pipeline : '')));
</script>

<div class="flex flex-col gap-5" data-testid="sub-pipeline-form">
  <Field
    spec={pipelineSpec}
    bind:value={pipeline}
    testId="sub-pipeline-path"
    error={fieldProblem('SubPipeline', 'pipeline', problems)}
    oninput={(v) => onChange({ attrs: { pipeline: v || undefined } })}
  />
</div>
