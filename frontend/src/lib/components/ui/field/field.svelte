<script lang="ts">
	// ABOUTME: Form row from the field boards: label, then hint, then control, then error, 4px apart
	// ABOUTME: Compose with Field.Label, Field.Description and Field.Error around any ui control
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div bind:this={ref} data-slot="field" class={cn("flex w-full min-w-0 flex-col gap-1", className)} {...restProps}>
	{@render children?.()}
</div>
