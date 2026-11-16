<script lang="ts" module>
  /** One connection leaving the Branch; `target` is the step it goes to, by name. */
  export interface BranchPath {
    id: string;
    target: string;
    label: string;
    loop: boolean;
    condition: string | null | undefined;
  }
</script>

<script lang="ts">
  // ABOUTME: A Branch step's settings: its note, then one "Go to “{target}” when…" field per outgoing connection
  // ABOUTME: Each field edits that connection's condition directly; the Rule syntax disclosure comes last

  import { untrack } from 'svelte';
  import { branchRuleField, KIND_NOTES } from '$lib/stepFields';
  import Field from './Field.svelte';
  import RuleSyntax from './RuleSyntax.svelte';

  // A ConditionalHandler reads nothing of its own (handler.rs): each
  // outgoing edge's `condition` (falling back to its label) picks the path,
  // so these fields write the edges, the same way EdgeForm does.
  let { paths, onChange }: { paths: BranchPath[]; onChange: (edgeId: string, condition: string | null) => void } = $props();

  // Seeded once per mount (the canvas remounts the inspector on every selection change).
  const conditions = $state<string[]>(untrack(() => paths.map((p) => p.condition ?? '')));
</script>

<div class="flex flex-col gap-5" data-testid="branch-rules">
  <p class="m-0 rounded-lg border border-border bg-card px-3.5 py-3 text-body leading-normal text-foreground">
    {KIND_NOTES.Conditional}
  </p>
  {#each paths as path, i (path.id)}
    <Field
      spec={branchRuleField(path)}
      bind:value={conditions[i]}
      testId="branch-rule-{i}"
      oninput={(v) => onChange(path.id, v.trim() ? v : null)}
    />
  {/each}
  <RuleSyntax />
</div>
