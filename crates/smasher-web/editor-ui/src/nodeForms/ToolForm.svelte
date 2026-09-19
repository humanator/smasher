<script lang="ts">
  import { untrack } from 'svelte';
  import './nodeForms.css';
  import type { NodeFormProps } from '../types';

  // Grounded in tool_handler.rs:53-92 (ToolHandler::execute): `tool` (falls
  // back to node label when absent -- same "blank clears the attr, not
  // writes empty string" treatment as CodergenForm's prompt) and `args`, a
  // JSON-encoded string (`serde_json::from_str::<Value>`, invalid JSON
  // fails the run with "invalid JSON in args attribute"). `model`/
  // `provider` are also folded into `args` by the real handler but are
  // power-user overrides out of this task's scope (tool/args only, per the
  // plan).
  let { attrs, onChange }: NodeFormProps = $props();

  let tool = $state(untrack(() => (typeof attrs.tool === 'string' ? attrs.tool : '')));
  let argsText = $state(untrack(() => (typeof attrs.args === 'string' ? attrs.args : '')));
  let argsError = $state(untrack(() => validateArgs(argsText)));

  function validateArgs(text: string): string | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    try {
      JSON.parse(trimmed);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'invalid JSON';
    }
  }

  function handleToolInput(event: Event) {
    tool = (event.target as HTMLInputElement).value;
    onChange({ attrs: { tool: tool || undefined } });
  }

  function handleArgsInput(event: Event) {
    argsText = (event.target as HTMLTextAreaElement).value;
    argsError = validateArgs(argsText);
    // Written as-is (even when invalid) -- this panel surfaces the problem
    // visibly rather than silently discarding what the human typed or
    // blocking them from continuing to edit; the real failure (if any)
    // surfaces at run time, same as it would for a hand-edited .dot file.
    onChange({ attrs: { args: argsText.trim() ? argsText : undefined } });
  }
</script>

<div class="node-form" data-testid="tool-form">
  <label class="node-form-field">
    Tool
    <input type="text" data-testid="tool-name" value={tool} oninput={handleToolInput} placeholder="e.g. shell" />
  </label>
  <label class="node-form-field">
    Args (JSON)
    <textarea data-testid="tool-args" rows="4" value={argsText} oninput={handleArgsInput}></textarea>
  </label>
  {#if argsError}
    <p class="node-form-error" role="alert" data-testid="tool-args-error">Invalid JSON: {argsError}</p>
  {/if}
</div>
