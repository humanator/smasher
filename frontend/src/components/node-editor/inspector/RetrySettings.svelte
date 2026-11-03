<script lang="ts">
  // ABOUTME: The More settings group under a step's own fields: Retries, Wait between attempts, Longest wait, Randomise the wait
  // ABOUTME: Every kind except Start, Finish and Branch gets it; values are written in the types retry.rs reads

  import { untrack } from 'svelte';
  import { stepFields, UNREAD_ATTRS } from '$lib/stepFields';
  import type { NodeFormProps } from '../types';
  import { attrText, numberOrText } from './attrText';
  import Field from './Field.svelte';
  import MoreSettings from './MoreSettings.svelte';

  // Grounded in retry.rs (RetryPolicy::from_node): `max_retries` (Number;
  // the legacy `retries` alias is read when it is absent, and is never
  // shown or rewritten here), `retry_delay` and `max_retry_delay` (Duration,
  // which the DOT parser makes from text like "1s" or "500ms"), and
  // `retry_jitter` (Bool). A switch removes its attr when set back to the
  // engine's default, so the file only carries what was changed.
  const SWITCH_DEFAULTS: Record<string, boolean> = { retry_jitter: true };

  let { handler, attrs, onChange }: NodeFormProps & { handler: string } = $props();

  const fields = $derived(stepFields(handler).filter((f) => f.advanced && !UNREAD_ATTRS.has(f.attr)));

  // Seeded once per mount (the canvas remounts the inspector on every selection change).
  const values = $state<Record<string, string>>(
    untrack(() => Object.fromEntries(fields.map((f) => [f.attr, attrText(attrs[f.attr])]))),
  );
  const checks = $state<Record<string, boolean>>(
    untrack(() =>
      Object.fromEntries(
        fields.map((f) => {
          const value = attrs[f.attr];
          const isSet = value === true || value === 'true' || value === false || value === 'false';
          return [f.attr, isSet ? value === true || value === 'true' : (SWITCH_DEFAULTS[f.attr] ?? false)];
        }),
      ),
    ),
  );

  function setSwitch(attr: string, on: boolean) {
    onChange({ attrs: { [attr]: on === (SWITCH_DEFAULTS[attr] ?? false) ? undefined : on } });
  }
</script>

{#if fields.length}
  <MoreSettings count={fields.length}>
    {#each fields as field (field.attr)}
      {#if field.control === 'switch'}
        <Field
          spec={field}
          bind:checked={checks[field.attr]}
          testId="more-{field.attr}"
          onCheckedChange={(on) => setSwitch(field.attr, on)}
        />
      {:else}
        <Field
          spec={field}
          bind:value={values[field.attr]}
          testId="more-{field.attr}"
          oninput={(v) => onChange({ attrs: { [field.attr]: numberOrText(v) } })}
        />
      {/if}
    {/each}
  </MoreSettings>
{/if}
