<script lang="ts">
  // ABOUTME: Tool node-kind side-panel form component
  // ABOUTME: Edits a built-in tool (tool/args) or a shell command (tool_command/timeout)

  import { untrack } from 'svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as NativeSelect from '$lib/components/ui/native-select/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import type { NodeFormProps } from '../types';

  // Grounded in tool_handler.rs (ToolHandler::execute): a tool node sets
  // exactly one of `tool` or `tool_command`. Neither or both fails the run
  // (lint E004/E005), and the node label is never used as a tool name.
  // Blank fields clear their attr rather than writing an empty string, the
  // same treatment as CodergenForm's prompt.
  //
  // - Built-in tool: `tool` plus `args`, a JSON-encoded string
  //   (`serde_json::from_str::<Value>`; invalid JSON fails the run with
  //   "invalid JSON in args attribute"). `model`/`provider` are also folded
  //   into `args` by the handler but are power-user overrides left out here.
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
  // it visible with a warning rather than silently dropping it.
  const KNOWN_TOOLS: { value: string; description: string }[] = [
    { value: 'render_capture', description: 'Render a candidate and capture a screenshot/manifest.' },
    { value: 'system_lint', description: 'Run the design-system lint check against a candidate.' },
    { value: 'task_critic', description: 'Run a persona-based usability critique of a candidate.' },
    { value: 'synthesis', description: 'Synthesise prior critiques into a single summary.' },
  ];

  type Mode = 'builtin' | 'command';

  function isKnownTool(name: string): boolean {
    return KNOWN_TOOLS.some((t) => t.value === name);
  }

  function attrText(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }

  let { attrs, onChange }: NodeFormProps = $props();
  const uid = $props.id();

  // Seeded once on mount (the parent's {#key node.id} remounts this
  // component when the selected node changes).
  let mode = $state<Mode>(untrack(() => (attrText(attrs.tool_command).trim() ? 'command' : 'builtin')));
  let tool = $state(untrack(() => attrText(attrs.tool)));
  let argsText = $state(untrack(() => attrText(attrs.args)));
  let argsError = $state(untrack(() => validateArgs(argsText)));
  let command = $state(untrack(() => attrText(attrs.tool_command)));
  let timeoutText = $state(untrack(() => attrText(attrs.timeout)));
  let selectedKnownTool = $derived(KNOWN_TOOLS.find((t) => t.value === tool));
  let unknownTool = $derived(tool !== '' && !isKnownTool(tool));

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

  function handleModeChange(event: Event) {
    mode = (event.target as HTMLSelectElement).value as Mode;
    // A node runs one or the other, so switching drops the other mode's attrs.
    if (mode === 'command') {
      tool = '';
      argsText = '';
      argsError = null;
      onChange({ attrs: { tool: undefined, args: undefined } });
    } else {
      command = '';
      timeoutText = '';
      onChange({ attrs: { tool_command: undefined, timeout: undefined } });
    }
  }

  function handleToolChange(event: Event) {
    tool = (event.target as HTMLSelectElement).value;
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

  function handleCommandInput(event: Event) {
    command = (event.target as HTMLTextAreaElement).value;
    onChange({ attrs: { tool_command: command.trim() ? command : undefined } });
  }

  function handleTimeoutInput(event: Event) {
    timeoutText = (event.target as HTMLInputElement).value;
    onChange({ attrs: { timeout: timeoutText.trim() ? timeoutText.trim() : undefined } });
  }
</script>

<div class="flex flex-col gap-3" data-testid="tool-form">
  <div class="flex flex-col gap-1.5">
    <Label for="{uid}-mode">Runs</Label>
    <NativeSelect.Root
      id="{uid}-mode"
      class="w-full"
      data-testid="tool-mode"
      value={mode}
      onchange={handleModeChange}
    >
      <NativeSelect.Option value="builtin">Built-in tool</NativeSelect.Option>
      <NativeSelect.Option value="command">Shell command</NativeSelect.Option>
    </NativeSelect.Root>
  </div>

  {#if mode === 'builtin'}
    <div class="flex flex-col gap-1.5">
      <Label for="{uid}-tool">Tool</Label>
      <NativeSelect.Root
        id="{uid}-tool"
        class="w-full"
        data-testid="tool-select"
        value={tool}
        onchange={handleToolChange}
      >
        <NativeSelect.Option value="">Select a tool…</NativeSelect.Option>
        {#each KNOWN_TOOLS as opt (opt.value)}
          <NativeSelect.Option value={opt.value}>{opt.value}</NativeSelect.Option>
        {/each}
        {#if unknownTool}
          <NativeSelect.Option value={tool}>{tool}</NativeSelect.Option>
        {/if}
      </NativeSelect.Root>
    </div>
    {#if selectedKnownTool}
      <p class="m-0 text-xs text-muted-foreground">{selectedKnownTool.description}</p>
    {/if}
    {#if unknownTool}
      <p class="m-0 text-xs text-destructive" role="alert" data-testid="tool-unknown-warning">
        "{tool}" is not a built-in tool, so this node will fail. Pick a built-in, or switch to a shell command.
      </p>
    {/if}
    <div class="flex flex-col gap-1.5">
      <Label for="{uid}-args">Args (JSON)</Label>
      <Textarea
        id="{uid}-args"
        class="font-mono text-xs"
        data-testid="tool-args"
        rows={4}
        value={argsText}
        oninput={handleArgsInput}
      />
    </div>
    {#if argsError}
      <p class="m-0 text-xs text-destructive" role="alert" data-testid="tool-args-error">Invalid JSON: {argsError}</p>
    {/if}
  {:else}
    <div class="flex flex-col gap-1.5">
      <Label for="{uid}-command">Command</Label>
      <Textarea
        id="{uid}-command"
        class="font-mono text-xs"
        data-testid="tool-command"
        rows={4}
        value={command}
        oninput={handleCommandInput}
        placeholder="e.g. npm test"
      />
      <p class="m-0 text-xs text-muted-foreground">
        Runs with <code>sh -c</code> in the run directory. Exit code 0 succeeds; its output is in
        <code>tool.output</code>.
      </p>
    </div>
    <div class="flex flex-col gap-1.5">
      <Label for="{uid}-timeout">Timeout</Label>
      <Input
        id="{uid}-timeout"
        type="text"
        data-testid="tool-timeout"
        value={timeoutText}
        oninput={handleTimeoutInput}
        placeholder="600 (seconds), or e.g. 30s"
      />
    </div>
  {/if}
</div>
