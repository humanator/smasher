<script lang="ts">
  // ABOUTME: Tool node-kind side-panel form component
  // ABOUTME: Edits a built-in tool (tool/args, plus a model for LLM tools) or a shell command (tool_command/timeout)

  import { untrack } from 'svelte';
  import { toolMode } from '$lib/nodeSummary';
  import { BUILT_IN_TOOLS, jsonError, stepFields, type FieldSpec } from '$lib/stepFields';
  import Field from '../inspector/Field.svelte';
  import type { NodeFormProps } from '../types';
  import ModelPicker from './ModelPicker.svelte';
  import { usesLlm } from './usesLlm';

  // Grounded in tool_handler.rs (ToolHandler::execute): a tool node sets
  // exactly one of `tool` or `tool_command`. Neither or both fails the run
  // (lint E004/E005), and the node label is never used as a tool name.
  // Blank fields clear their attr rather than writing an empty string, the
  // same treatment as CodergenForm's prompt -- except the command (below).
  //
  // - Built-in tool: `tool` plus `args`, a JSON-encoded string
  //   (`serde_json::from_str::<Value>`; invalid JSON fails the run with
  //   "invalid JSON in args attribute"). `model`/`provider` are also folded
  //   into `args` by the handler; the shared ModelPicker edits them for the
  //   tools that call a model (see usesLlm).
  // - Shell command: `tool_command`, run with `sh -c` in the run directory,
  //   plus `timeout` (seconds, or a duration such as `30s`; 600 by default).
  //
  // `tool` is a closed set: the chain built in
  // crates/smasher-web/src/run_launch.rs (TaskCriticSynthesisToolBackend ->
  // SystemLintToolBackend -> HybridToolBackend -> UnknownToolBackend) routes
  // each of these four names to a different Rust implementation
  // (render_capture drives a headless-Chromium capture, system_lint runs a
  // static design-system lint, task_critic/synthesis run persona-based LLM
  // critique passes). Any other name reaches UnknownToolBackend and fails
  // the run, so there's no free-text tool name; a node loaded with one keeps
  // it (no radio is checked) with a warning rather than silently dropping it.
  //
  // The mode is nodeSummary's toolMode: shell whenever `tool_command` exists,
  // even empty, so the step card and this form always agree. Switching to a
  // shell command therefore writes an empty `tool_command`, and clearing the
  // command keeps it empty rather than deleting it.

  type Mode = 'builtin' | 'command';

  function attrText(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }

  let { attrs, onChange }: NodeFormProps = $props();

  const fields = stepFields('Tool');
  const spec = (attr: string): FieldSpec => fields.find((f) => f.attr === attr)!;

  // Seeded once on mount (the parent's {#key} remounts this component when
  // the selected node changes).
  let mode = $state<string>(untrack(() => toolMode(attrs)));
  let tool = $state(untrack(() => attrText(attrs.tool)));
  let argsText = $state(untrack(() => attrText(attrs.args)));
  let command = $state(untrack(() => attrText(attrs.tool_command)));
  let timeoutText = $state(untrack(() => attrText(attrs.timeout)));
  let unknownTool = $derived(tool !== '' && !BUILT_IN_TOOLS.some((t) => t.value === tool));
  let showModelPicker = $derived(usesLlm('Tool', { tool }));

  function handleModeChange(next: string) {
    // A node runs one or the other, so switching drops the other mode's attrs.
    if ((next as Mode) === 'command') {
      tool = '';
      argsText = '';
      onChange({ attrs: { tool: undefined, args: undefined, tool_command: '' } });
    } else {
      command = '';
      timeoutText = '';
      onChange({ attrs: { tool_command: undefined, timeout: undefined } });
    }
  }
</script>

<div class="flex flex-col gap-5" data-testid="tool-form">
  <Field spec={spec('tool_mode')} bind:value={mode} testId="tool-mode" oninput={handleModeChange} />

  {#if mode === 'builtin'}
    <div class="flex flex-col gap-2">
      <Field
        spec={spec('tool')}
        bind:value={tool}
        testId="tool-select"
        oninput={(v) => onChange({ attrs: { tool: v || undefined } })}
      />
      {#if unknownTool}
        <p class="m-0 text-small text-destructive" role="alert" data-testid="tool-unknown-warning">
          "{tool}" is not a built-in tool, so this node will fail. Pick a built-in, or switch to a shell command.
        </p>
      {/if}
    </div>
    <!-- Written as-is even when invalid: the error flags it without blocking
         the edit, and the real failure (if any) surfaces at run time, same as
         it would for a hand-edited .dot file. -->
    <Field
      spec={spec('args')}
      bind:value={argsText}
      testId="tool-args"
      error={jsonError(argsText)}
      oninput={(v) => onChange({ attrs: { args: v.trim() ? v : undefined } })}
    />
    {#if showModelPicker}
      <Field spec={spec('model')}>
        <ModelPicker
          idPrefix="tool"
          provider={typeof attrs.provider === 'string' ? attrs.provider : undefined}
          model={typeof attrs.model === 'string' ? attrs.model : undefined}
          onChange={(patch) => onChange({ attrs: patch })}
        />
      </Field>
    {/if}
  {:else}
    <Field
      spec={spec('tool_command')}
      bind:value={command}
      testId="tool-command"
      oninput={(v) => onChange({ attrs: { tool_command: v.trim() ? v : '' } })}
    />
    <Field
      spec={spec('timeout')}
      bind:value={timeoutText}
      testId="tool-timeout"
      oninput={(v) => onChange({ attrs: { timeout: v.trim() ? v.trim() : undefined } })}
    />
  {/if}
</div>
