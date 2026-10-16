<script lang="ts">
	// ABOUTME: Radio group root (bits-ui) laid out as a vertical stack with the field boards' 8px gap
	// ABOUTME: Give it aria-label or aria-labelledby; items pair with a Label via id/for
	import { RadioGroup as RadioGroupPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		value = $bindable(""),
		class: className,
		...restProps
	}: RadioGroupPrimitive.RootProps = $props();
</script>

<RadioGroupPrimitive.Root bind:ref bind:value data-slot="radio-group" class={cn("grid gap-2", className)} {...restProps} />
