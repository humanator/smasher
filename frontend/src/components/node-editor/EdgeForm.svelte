<script lang="ts">
  // ABOUTME: Edge-selection side-panel form component
  // ABOUTME: Edits label/condition/priority/loop_restart, with copy from stepFields and the Rule syntax disclosure

  import { untrack } from 'svelte';
  import { CONNECTION_FIELDS, priorityError, type FieldSpec } from '$lib/stepFields';
  import Field from './inspector/Field.svelte';
  import RuleSyntax from './inspector/RuleSyntax.svelte';
  import type { EdgeFormProps } from './types';

  // Grounded in graph/mod.rs:245-283 (extract_condition/extract_priority/
  // extract_loop_restart) -- condition falls back to the edge's `label` when
  // absent (a *read-time* concern the resolver already implements; this form
  // only ever writes `condition` itself, same "form writes the specific
  // field, label/fallback stays untouched" split CodergenForm/InterviewerForm
  // already established for nodes). `label` is its own field here: the
  // name drawn on the canvas pill, which is also the condition's fallback.
  // `priority` is an i32 (extract_priority rejects a non-integer value with a
  // resolve error -- graph/mod.rs:258-270), so this form validates it's a
  // parseable integer client-side rather than letting a bad save round-trip
  // fail server-side. `loop_restart` defaults to `false`
  // (extract_loop_restart), never absent.
  let { label, condition, priority, loopRestart, onChange }: EdgeFormProps = $props();

  const spec = (attr: string): FieldSpec => CONNECTION_FIELDS.find((f) => f.attr === attr)!;

  // Seeded once per mount -- the canvas remounts this component via {#key}
  // on every selection change (matching the nodeForms/*.svelte convention),
  // so "captures the initial value only" is intended, not a bug.
  let labelText = $state(untrack(() => label ?? ''));
  let conditionText = $state(untrack(() => condition ?? ''));
  let priorityText = $state(untrack(() => (priority === null ? '' : String(priority))));
  let loopRestartChecked = $state(untrack(() => loopRestart));

  const priorityMessage = $derived(priorityError(priorityText.trim()));

  function handlePriorityInput(value: string) {
    const trimmed = value.trim();
    // Integer only, matching extract_priority's own `as_i32()` -- a
    // fractional or non-numeric value fails resolve() server-side, so this
    // panel surfaces the problem instead of writing a value guaranteed to
    // fail on save (same discipline ToolForm/ManagerForm apply to invalid
    // JSON, just rejected before onChange rather than after).
    if (priorityError(trimmed)) return;
    onChange({ priority: trimmed ? Number(trimmed) : null });
  }
</script>

<div class="flex flex-col gap-5" data-testid="edge-form">
  <Field
    spec={spec('label')}
    bind:value={labelText}
    testId="edge-label"
    oninput={(v) => onChange({ label: v.trim() ? v : null })}
  />
  <Field
    spec={spec('condition')}
    bind:value={conditionText}
    testId="edge-condition"
    oninput={(v) => onChange({ condition: v.trim() ? v : null })}
  />
  <Field
    spec={spec('priority')}
    bind:value={priorityText}
    testId="edge-priority"
    error={priorityMessage}
    oninput={handlePriorityInput}
  />
  <Field
    spec={spec('loop_restart')}
    bind:checked={loopRestartChecked}
    testId="edge-loop-restart"
    onCheckedChange={(on) => onChange({ loopRestart: on })}
  />
  <RuleSyntax />
</div>
