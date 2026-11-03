<script lang="ts">
  // ABOUTME: Manager (AI Coordinator) node-kind side-panel form component
  // ABOUTME: Edits Task, Settings (JSON) and the Model that runs it, with copy from stepFields

  import { untrack } from 'svelte';
  import { jsonError, stepFields, type FieldSpec } from '$lib/stepFields';
  import { fieldProblem } from '$lib/workflowProblems';
  import Field from '../inspector/Field.svelte';
  import type { NodeFormProps } from '../types';
  import ModelPicker from './ModelPicker.svelte';
  import { usesLlm } from './usesLlm';

  // Grounded in manager_handler.rs:49-90 (ManagerHandler::execute): `task`
  // (falls back to node label when absent) and `config`, a JSON-encoded
  // string (`serde_json::from_str::<Value>`, invalid JSON fails the run
  // with "invalid JSON in config attribute") -- same treatment as
  // ToolForm's tool/args. `model`/`provider` are edited by the shared
  // ModelPicker.
  //
  // Unlike Tool's `tool` attr (a closed set of real, differently-behaving
  // Rust backends -- see ToolForm's own comment), `task` has no fixed
  // vocabulary anywhere in the engine: `LlmManagerBackend::coordinate`
  // (crates/smasher-web/src/backend.rs) sends it straight into an LLM
  // prompt as free-form text ("Task: {task}"), so a `<select>` here would
  // misrepresent it as a closed enum. The catalogue's Try chips suggest
  // tasks while keeping this a genuine free-text field -- picking one,
  // editing one, or ignoring them entirely all work.

  let { attrs, onChange, problems = [] }: NodeFormProps = $props();

  const fields = stepFields('Manager');
  const spec = (attr: string): FieldSpec => fields.find((f) => f.attr === attr)!;

  let task = $state(untrack(() => (typeof attrs.task === 'string' ? attrs.task : '')));
  let configText = $state(untrack(() => (typeof attrs.config === 'string' ? attrs.config : '')));
</script>

<div class="flex flex-col gap-5" data-testid="manager-form">
  <Field
    spec={spec('task')}
    bind:value={task}
    testId="manager-task"
    error={fieldProblem('Manager', 'task', problems)}
    oninput={(v) => onChange({ attrs: { task: v || undefined } })}
  />
  <!-- Written as-is even when invalid: the error flags it without blocking the edit. -->
  <Field
    spec={spec('config')}
    bind:value={configText}
    testId="manager-config"
    error={jsonError(configText)}
    oninput={(v) => onChange({ attrs: { config: v.trim() ? v : undefined } })}
  />
  {#if usesLlm('Manager', attrs)}
    <Field spec={spec('model')}>
      <ModelPicker
        idPrefix="manager"
        provider={typeof attrs.provider === 'string' ? attrs.provider : undefined}
        model={typeof attrs.model === 'string' ? attrs.model : undefined}
        onChange={(patch) => onChange({ attrs: patch })}
      />
    </Field>
  {/if}
</div>
