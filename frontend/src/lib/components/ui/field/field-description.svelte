<script lang="ts">
	// ABOUTME: Field hint, 11.5px muted, drawn between the label and the control as the boards do
	// ABOUTME: Give it an id and point the control's aria-describedby at it
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLParagraphElement>> = $props();
</script>

<p bind:this={ref} data-slot="field-description" class={cn("text-hint text-muted-foreground m-0", className)} {...restProps}>
	{@render children?.()}
</p>
