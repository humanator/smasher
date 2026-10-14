<script lang="ts">
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import TriangleIcon from '@lucide/svelte/icons/play';
	import { cn, type WithoutChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		children,
		...restProps
	}: WithoutChild<AccordionPrimitive.TriggerProps> & {
		level?: AccordionPrimitive.HeaderProps["level"];
	} = $props();
</script>

<AccordionPrimitive.Header {level} class="flex">
	<AccordionPrimitive.Trigger
		data-slot="accordion-trigger"
		bind:ref
		class={cn(
			"gap-1.5 px-2.5 py-[9px] text-left text-[13px] font-semibold group/accordion-trigger relative flex flex-1 items-center border-0 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-45",
			className
		)}
		{...restProps}
	>
		<TriangleIcon data-slot="accordion-trigger-icon" aria-hidden="true" class="pointer-events-none size-2.5 shrink-0 fill-muted-foreground stroke-muted-foreground transition-transform duration-150 group-aria-expanded/accordion-trigger:rotate-90" />
		<span>{@render children?.()}</span>
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
