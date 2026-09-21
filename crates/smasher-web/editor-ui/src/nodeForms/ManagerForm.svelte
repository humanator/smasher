<script lang="ts">
  import { untrack } from 'svelte';
  import './nodeForms.css';
  import type { NodeFormProps } from '../types';

  // Grounded in manager_handler.rs:49-90 (ManagerHandler::execute): `task`
  // (falls back to node label when absent) and `config`, a JSON-encoded
  // string (`serde_json::from_str::<Value>`, invalid JSON fails the run
  // with "invalid JSON in config attribute") -- same treatment as
  // ToolForm's tool/args. `model`/`provider` fold-in is also real but out
  // of this task's scope (task/config only, per the plan).
  //
  // Unlike Tool's `tool` attr (a closed set of real, differently-behaving
  // Rust backends -- see ToolForm's own comment), `task` has no fixed
  // vocabulary anywhere in the engine: `LlmManagerBackend::coordinate`
  // (crates/smasher-web/src/backend.rs) sends it straight into an LLM
  // prompt as free-form text ("Task: {task}"), so a `<select>` here would
  // misrepresent it as a closed enum. `list=`/`<datalist>` gives a native
  // dropdown of suggestions while keeping this a genuine free-text field --
  // picking one, editing one, or ignoring them entirely all work.
  const TASK_SUGGESTIONS = ['coordinate-review', 'delegate-subtask', 'aggregate-results', 'escalate-to-human'];

  let { attrs, onChange }: NodeFormProps = $props();

  let task = $state(untrack(() => (typeof attrs.task === 'string' ? attrs.task : '')));
  let configText = $state(untrack(() => (typeof attrs.config === 'string' ? attrs.config : '')));
  let configError = $state(untrack(() => validateConfig(configText)));

  function validateConfig(text: string): string | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    try {
      JSON.parse(trimmed);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'invalid JSON';
    }
  }

  function handleTaskInput(event: Event) {
    task = (event.target as HTMLInputElement).value;
    onChange({ attrs: { task: task || undefined } });
  }

  function handleConfigInput(event: Event) {
    configText = (event.target as HTMLTextAreaElement).value;
    configError = validateConfig(configText);
    onChange({ attrs: { config: configText.trim() ? configText : undefined } });
  }
</script>

<div class="node-form" data-testid="manager-form">
  <label class="node-form-field">
    Task
    <input
      type="text"
      data-testid="manager-task"
      list="manager-task-suggestions"
      value={task}
      oninput={handleTaskInput}
      placeholder="e.g. coordinate-review"
    />
    <datalist id="manager-task-suggestions">
      {#each TASK_SUGGESTIONS as suggestion (suggestion)}
        <option value={suggestion}></option>
      {/each}
    </datalist>
  </label>
  <p class="node-form-hint">A free-text description of the coordination task, sent to the LLM as-is -- the suggestions above are starting points, not fixed options.</p>
  <label class="node-form-field">
    Config (JSON)
    <textarea data-testid="manager-config" rows="4" value={configText} oninput={handleConfigInput}></textarea>
  </label>
  {#if configError}
    <p class="node-form-error" role="alert" data-testid="manager-config-error">Invalid JSON: {configError}</p>
  {/if}
</div>
