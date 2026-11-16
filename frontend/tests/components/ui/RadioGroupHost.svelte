<script lang="ts">
	// ABOUTME: Test host rendering a labelled RadioGroup with three options
	// ABOUTME: Lets radio-group.test.ts check roles, selection and the checkbox-derived styling
	import * as RadioGroup from '../../../src/lib/components/ui/radio-group/index.js';
	import { Label } from '../../../src/lib/components/ui/label/index.js';

	let { value = $bindable('yes') }: { value?: string } = $props();
</script>

<RadioGroup.Root bind:value aria-label="Approve this design?">
	{#each ['yes', 'no', 'later'] as option (option)}
		<div class="flex items-center gap-2">
			<RadioGroup.Item value={option} id={`opt-${option}`} />
			<Label for={`opt-${option}`}>{option}</Label>
		</div>
	{/each}
</RadioGroup.Root>
<p data-testid="value">{value}</p>
