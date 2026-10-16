<script lang="ts">
  // ABOUTME: Test host composing Field the way the boards draw a form row
  // ABOUTME: Label, then hint, then control, then an optional error
  import * as Field from '../../../src/lib/components/ui/field/index.js';
  import Input from '../../../src/lib/components/ui/input/input.svelte';
  let { error = '' }: { error?: string } = $props();
</script>

<Field.Root>
  <Field.Label for="brief">Brief</Field.Label>
  <Field.Description id="brief-hint">A short note on what this run is for.</Field.Description>
  <Input id="brief" aria-describedby="brief-hint" aria-invalid={error ? 'true' : undefined} />
  {#if error}<Field.Error>{error}</Field.Error>{/if}
</Field.Root>
