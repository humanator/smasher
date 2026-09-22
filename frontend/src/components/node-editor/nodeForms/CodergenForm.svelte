<script lang="ts">
  // ABOUTME: Codergen node-kind side-panel form component
  // ABOUTME: Edits prompt/model attributes

  import { untrack } from 'svelte';
  import './nodeForms.css';
  import type { NodeFormProps } from '../types';

  // Grounded in handler.rs:227-269 (CodergenHandler::execute): `prompt`
  // falls back to the node's `label` only when the attr key is *absent* --
  // `Some(NodeAttrValue::String(s)) => s.clone()` applies even when `s` is
  // an empty string, so a blank field here writes `undefined` (deletes the
  // attr) rather than `""`, to keep the label fallback working instead of
  // silently overriding it with an empty prompt. `model` is a plain
  // optional override. `provider`/`backend` are also read by the real
  // handler but are power-user overrides out of this task's scope
  // (prompt/model only, per the plan) -- can be added later without
  // changing this component's contract.
  let { attrs, onChange }: NodeFormProps = $props();

  // `attrs` seeds local field state exactly once per mount -- the parent
  // (WorkflowCanvasInner) remounts this component via {#key node.id} on
  // every selection change, so "only captures the initial value" is the
  // intended behavior here, not a bug; `untrack` says so explicitly rather
  // than leaving the compiler's state_referenced_locally warning unexplained.
  let prompt = $state(untrack(() => (typeof attrs.prompt === 'string' ? attrs.prompt : '')));
  let model = $state(untrack(() => (typeof attrs.model === 'string' ? attrs.model : '')));

  function handlePromptInput(event: Event) {
    prompt = (event.target as HTMLTextAreaElement).value;
    onChange({ attrs: { prompt: prompt || undefined } });
  }

  function handleModelInput(event: Event) {
    model = (event.target as HTMLInputElement).value;
    onChange({ attrs: { model: model || undefined } });
  }
</script>

<div class="node-form" data-testid="codergen-form">
  <label class="node-form-field">
    Prompt
    <textarea data-testid="codergen-prompt" rows="4" value={prompt} oninput={handlePromptInput}></textarea>
  </label>
  <label class="node-form-field">
    Model
    <input
      type="text"
      data-testid="codergen-model"
      value={model}
      oninput={handleModelInput}
      placeholder="e.g. claude-sonnet-4-5 (optional override)"
    />
  </label>
</div>
