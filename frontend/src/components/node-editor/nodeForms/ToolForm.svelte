<script lang="ts">
  // ABOUTME: Tool node-kind side-panel form component
  // ABOUTME: Edits tool/args attributes with JSON validation

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
  //
  // `tool` is a real closed-ish set, unlike Manager's `task` (see
  // ManagerForm's own comment): the actual backend chain assembled in
  // crates/smasher-web/src/routes/pages.rs (TaskCriticSynthesisToolBackend
  // -> SystemLintToolBackend -> HybridToolBackend -> LlmToolBackend) routes
  // each of these four names to a materially different Rust implementation
  // (render_capture drives a headless-Chromium capture, system_lint runs a
  // static design-system lint, task_critic/synthesis run persona-based LLM
  // critique passes) -- picking the wrong one changes what actually runs,
  // not just a label. Anything else still falls through to LlmToolBackend,
  // which executes *any* tool name via a raw LLM prompt, so "Custom…" keeps
  // that escape hatch rather than locking the field to only these four.
  const KNOWN_TOOLS: { value: string; description: string }[] = [
    { value: 'render_capture', description: 'Render a candidate and capture a screenshot/manifest.' },
    { value: 'system_lint', description: 'Run the design-system lint check against a candidate.' },
    { value: 'task_critic', description: 'Run a persona-based usability critique of a candidate.' },
    { value: 'synthesis', description: 'Synthesise prior critiques into a single summary.' },
  ];
  const CUSTOM_VALUE = '__custom__';

  function isKnownTool(name: string): boolean {
    return KNOWN_TOOLS.some((t) => t.value === name);
  }

  let { attrs, onChange }: NodeFormProps = $props();

  let tool = $state(untrack(() => (typeof attrs.tool === 'string' ? attrs.tool : '')));
  let argsText = $state(untrack(() => (typeof attrs.args === 'string' ? attrs.args : '')));
  let argsError = $state(untrack(() => validateArgs(argsText)));
  // Seeded once from the loaded tool name (same one-time-read-on-mount
  // convention as `tool`/`argsText` above -- the parent's {#key node.id}
  // remounts this component on node selection change): an unrecognized
  // (or blank) tool starts in "Custom" mode so its real value stays
  // visible/editable instead of silently disappearing behind the select.
  let selectValue = $state(untrack(() => (tool && !isKnownTool(tool) ? CUSTOM_VALUE : tool)));
  let showCustomInput = $derived(selectValue === CUSTOM_VALUE);
  let selectedKnownTool = $derived(KNOWN_TOOLS.find((t) => t.value === selectValue));

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

  function commitTool(next: string) {
    tool = next;
    onChange({ attrs: { tool: tool || undefined } });
  }

  function handleSelectChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    selectValue = value;
    if (value === CUSTOM_VALUE) {
      // Keep whatever custom text was already there (e.g. switching back
      // from a known tool and then back to Custom); otherwise start blank.
      commitTool(tool && !isKnownTool(tool) ? tool : '');
    } else {
      commitTool(value);
    }
  }

  function handleCustomToolInput(event: Event) {
    commitTool((event.target as HTMLInputElement).value);
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
    <select data-testid="tool-select" value={selectValue} onchange={handleSelectChange}>
      <option value="">Select a tool…</option>
      {#each KNOWN_TOOLS as opt (opt.value)}
        <option value={opt.value}>{opt.value}</option>
      {/each}
      <option value={CUSTOM_VALUE}>Custom…</option>
    </select>
  </label>
  {#if selectedKnownTool}
    <p class="node-form-hint">{selectedKnownTool.description}</p>
  {/if}
  {#if showCustomInput}
    <label class="node-form-field">
      Custom tool name
      <input
        type="text"
        data-testid="tool-name"
        value={tool}
        oninput={handleCustomToolInput}
        placeholder="e.g. shell"
      />
    </label>
  {/if}
  <label class="node-form-field">
    Args (JSON)
    <textarea data-testid="tool-args" rows="4" value={argsText} oninput={handleArgsInput}></textarea>
  </label>
  {#if argsError}
    <p class="node-form-error" role="alert" data-testid="tool-args-error">Invalid JSON: {argsError}</p>
  {/if}
</div>
