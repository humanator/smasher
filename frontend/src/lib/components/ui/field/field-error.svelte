<script lang="ts">
	// ABOUTME: Field error, 11.5px in the error-text red, announced as an alert
	// ABOUTME: Render it only while the control is invalid (aria-invalid="true")
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLParagraphElement>> = $props();
</script>

<p bind:this={ref} role="alert" data-slot="field-error" class={cn("text-hint text-destructive m-0", className)} {...restProps}>
	{@render children?.()}
</p>
