<script lang="ts">
  // ABOUTME: Task 8 edge-selection side-panel form: condition/priority/
  // ABOUTME: loop_restart, the 3 edge attrs Task 2's round-trip fix preserves.
  import { untrack } from 'svelte';
  import './nodeForms/nodeForms.css';
  import type { EdgeFormProps } from './types';

  // Grounded in graph/mod.rs:245-283 (extract_condition/extract_priority/
  // extract_loop_restart) -- condition falls back to the edge's `label` when
  // absent (a *read-time* concern the resolver already implements; this form
  // only ever writes `condition` itself, same "form writes the specific
  // field, label/fallback stays untouched" split CodergenForm/InterviewerForm
  // already established for nodes -- edges have no separate label field in
  // this panel, so `label` here is simply left alone). `priority` is an
  // i32 (extract_priority rejects a non-integer value with a resolve error --
  // graph/mod.rs:258-270), so this form validates it's a parseable integer
  // client-side rather than letting a bad save round-trip fail server-side.
  // `loop_restart` defaults to `false` (extract_loop_restart), never absent.
  let { condition, priority, loopRestart, onChange }: EdgeFormProps = $props();

  // Seeded once per mount -- WorkflowCanvasInner.svelte remounts this
  // component via {#key edge.id} on every selection change (matching the
  // nodeForms/*.svelte convention), so "captures the initial value only" is
  // intended, not a bug.
  let conditionText = $state(untrack(() => condition ?? ''));
  let priorityText = $state(untrack(() => (priority === null ? '' : String(priority))));
  let priorityError = $state<string | null>(null);
  let loopRestartChecked = $state(untrack(() => loopRestart));

  function handleConditionInput(event: Event) {
    conditionText = (event.target as HTMLInputElement).value;
    onChange({ condition: conditionText.trim() ? conditionText : null });
  }

  function handlePriorityInput(event: Event) {
    priorityText = (event.target as HTMLInputElement).value;
    const trimmed = priorityText.trim();
    if (!trimmed) {
      priorityError = null;
      onChange({ priority: null });
      return;
    }
    // Integer only, matching extract_priority's own `as_i32()` -- a
    // fractional or non-numeric value fails resolve() server-side, so this
    // panel surfaces the problem instead of writing a value guaranteed to
    // fail on save (same discipline ToolForm/ManagerForm apply to invalid
    // JSON, just rejected before onChange rather than after).
    if (!/^-?\d+$/.test(trimmed)) {
      priorityError = 'priority must be a whole number';
      return;
    }
    priorityError = null;
    onChange({ priority: Number(trimmed) });
  }

  function handleLoopRestartChange(event: Event) {
    loopRestartChecked = (event.target as HTMLInputElement).checked;
    onChange({ loopRestart: loopRestartChecked });
  }
</script>

<div class="node-form" data-testid="edge-form">
  <label class="node-form-field">
    Condition
    <input
      type="text"
      data-testid="edge-condition"
      value={conditionText}
      oninput={handleConditionInput}
      placeholder="e.g. x > 5 (falls back to this edge's label if blank)"
    />
  </label>
  <label class="node-form-field">
    Priority
    <input
      type="text"
      inputmode="numeric"
      data-testid="edge-priority"
      value={priorityText}
      oninput={handlePriorityInput}
      placeholder="e.g. 1"
    />
  </label>
  {#if priorityError}
    <p class="node-form-error" role="alert" data-testid="edge-priority-error">{priorityError}</p>
  {/if}
  <label class="node-form-field node-form-field-inline">
    <input
      type="checkbox"
      data-testid="edge-loop-restart"
      checked={loopRestartChecked}
      onchange={handleLoopRestartChange}
    />
    Loop restart
  </label>
</div>
