<script lang="ts">
	import { Accordion as AccordionPrimitive } from "bits-ui";
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
			"gap-1.5 px-2.5 py-[9px] text-left text-body font-semibold group/accordion-trigger relative flex flex-1 items-center border-0 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-45",
			className
		)}
		{...restProps}
	>
		<!-- The board's sharp disclosure triangle; lucide's play icon is rounded and stroked. -->
		<svg data-slot="accordion-trigger-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" class="text-muted-foreground pointer-events-none size-2.5 shrink-0 transition-transform duration-150 group-aria-expanded/accordion-trigger:rotate-90"><path d="M8 4l10 8-10 8z" /></svg>
		<span>{@render children?.()}</span>
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
