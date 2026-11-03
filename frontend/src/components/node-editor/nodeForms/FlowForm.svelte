<script lang="ts">
  // ABOUTME: Flow and structural node-kind side-panel form: Split's two settings, or the note for Join, Start, Finish and Branch
  // ABOUTME: Also the fallback for unrecognized kinds, which get the no-settings note

  import { untrack } from 'svelte';
  import { KIND_NOTES, stepFields, type FieldSpec } from '$lib/stepFields';
  import { attrText, numberOrText } from '../inspector/attrText';
  import Field from '../inspector/Field.svelte';
  import type { NodeFormProps } from '../types';

  // Grounded in parallel.rs (parallel_attrs_from_node): a Split reads
  // `max_concurrency` as a Number (10 when absent) and `fail_fast` as a
  // Bool (false when absent). Join (FanIn), Start, Finish (Exit) and Branch
  // (Conditional) read nothing of their own: node_type_from_shape derives
  // the kind from `shape`, and a Branch's rules live on its outgoing edges.
  let { handler, attrs, onChange }: NodeFormProps & { handler: string } = $props();

  const fields = stepFields('Parallel');
  const spec = (attr: string): FieldSpec => fields.find((f) => f.attr === attr)!;

  let maxConcurrency = $state(untrack(() => attrText(attrs.max_concurrency)));
  let failFast = $state(untrack(() => attrs.fail_fast === true || attrs.fail_fast === 'true'));

  const note = $derived(KIND_NOTES[handler] ?? KIND_NOTES.Start);
</script>

<div class="flex flex-col gap-5" data-testid="flow-form">
  {#if handler === 'Parallel'}
    <Field
      spec={spec('max_concurrency')}
      bind:value={maxConcurrency}
      testId="parallel-max-concurrency"
      oninput={(v) => onChange({ attrs: { max_concurrency: numberOrText(v) } })}
    />
    <Field
      spec={spec('fail_fast')}
      bind:checked={failFast}
      testId="parallel-fail-fast"
      onCheckedChange={(on) => onChange({ attrs: { fail_fast: on || undefined } })}
    />
  {:else}
    <p class="m-0 rounded-lg border border-border bg-card px-3.5 py-3 text-body leading-normal text-foreground">{note}</p>
  {/if}
</div>
