<script lang="ts">
  // ABOUTME: Codergen node-kind side-panel form component
  // ABOUTME: Edits prompt, provider and model attributes

  import { untrack } from 'svelte';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
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
  const uid = $props.id();

  // `attrs` seeds local field state exactly once per mount -- the parent
  // (WorkflowCanvasInner) remounts this component via {#key node.id} on
  // every selection change, so "only captures the initial value" is the
  // intended behavior here, not a bug; `untrack` says so explicitly rather
  // than leaving the compiler's state_referenced_locally warning unexplained.
  let prompt = $state(untrack(() => (typeof attrs.prompt === 'string' ? attrs.prompt : '')));

  function handlePromptInput(event: Event) {
    prompt = (event.target as HTMLTextAreaElement).value;
    onChange({ attrs: { prompt: prompt || undefined } });
  }
</script>

<div class="flex flex-col gap-3" data-testid="codergen-form">
  <div class="flex flex-col gap-1.5">
    <Label for="{uid}-prompt">Prompt</Label>
    <Textarea
      id="{uid}-prompt"
      class="font-mono text-xs"
      data-testid="codergen-prompt"
      rows={4}
      value={prompt}
      oninput={handlePromptInput}
    />
  </div>
  <ModelPicker
    idPrefix="codergen"
    provider={typeof attrs.provider === 'string' ? attrs.provider : undefined}
    model={typeof attrs.model === 'string' ? attrs.model : undefined}
    onChange={(patch) => onChange({ attrs: patch })}
  />
</div>
