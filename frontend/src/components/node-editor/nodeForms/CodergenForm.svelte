<script lang="ts">
  // ABOUTME: Codergen (AI Agent) node-kind side-panel form component
  // ABOUTME: Edits Instructions (prompt) and the Model (provider and model), with copy from stepFields

  import { untrack } from 'svelte';
  import { stepFields, type FieldSpec } from '$lib/stepFields';
  import Field from '../inspector/Field.svelte';
  import type { NodeFormProps } from '../types';
  import ModelPicker from './ModelPicker.svelte';

  // Grounded in handler.rs:227-269 (CodergenHandler::execute): `prompt`
  // falls back to the node's `label` only when the attr key is *absent* --
  // `Some(NodeAttrValue::String(s)) => s.clone()` applies even when `s` is
  // an empty string, so a blank field here writes `undefined` (deletes the
  // attr) rather than `""`, to keep the label fallback working instead of
  // silently overriding it with an empty prompt. `model` is a plain
  // optional override, and `provider` picks which LLM provider serves it;
  // both are edited by the shared ModelPicker. `backend` is also read by the
  // real handler but stays a power-user override outside this form.
  let { attrs, onChange }: NodeFormProps = $props();

  const fields = stepFields('Codergen');
  const spec = (attr: string): FieldSpec => fields.find((f) => f.attr === attr)!;

  // `attrs` seeds local field state exactly once per mount -- the parent
  // remounts this component via {#key} on every selection change, so "only
  // captures the initial value" is the intended behavior here, not a bug;
  // `untrack` says so explicitly rather than leaving the compiler's
  // state_referenced_locally warning unexplained.
  let prompt = $state(untrack(() => (typeof attrs.prompt === 'string' ? attrs.prompt : '')));
</script>

<div class="flex flex-col gap-5" data-testid="codergen-form">
  <Field
    spec={spec('prompt')}
    bind:value={prompt}
    testId="codergen-prompt"
    oninput={(v) => onChange({ attrs: { prompt: v || undefined } })}
  />
  <Field spec={spec('model')}>
    <ModelPicker
      idPrefix="codergen"
      provider={typeof attrs.provider === 'string' ? attrs.provider : undefined}
      model={typeof attrs.model === 'string' ? attrs.model : undefined}
      onChange={(patch) => onChange({ attrs: patch })}
    />
  </Field>
</div>
