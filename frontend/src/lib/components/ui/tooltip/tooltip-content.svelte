<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import type { WithoutChildrenOrChild } from "$lib/utils.js";
	import TooltipPortal from "./tooltip-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 6,
		side = "top",
		children,
		portalProps,
		...restProps
	}: TooltipPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof TooltipPortal>>;
	} = $props();
</script>

<TooltipPortal {...portalProps}>
	<TooltipPrimitive.Content
		bind:ref
		data-slot="tooltip-content"
		{sideOffset}
		{side}
		class={cn(
			"data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[11px] leading-[1.35] has-data-[slot=kbd]:pr-1.5 z-50 w-fit max-w-[280px] origin-(--bits-tooltip-content-transform-origin) bg-[#F6F6F6] text-foreground shadow-[0_0_0_.5px_rgba(0,0,0,.2),0_4px_12px_rgba(0,0,0,.14)] dark:bg-popover dark:shadow-[0_0_0_.5px_rgba(255,255,255,.18),0_4px_12px_rgba(0,0,0,.4)]",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
	</TooltipPrimitive.Content>
</TooltipPortal>
