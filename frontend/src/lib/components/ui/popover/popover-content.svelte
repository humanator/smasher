<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";
	import PopoverPortal from "./popover-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 10,
		align = "center",
		portalProps,
		children,
		...restProps
	}: PopoverPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof PopoverPortal>>;
	} = $props();
</script>

<PopoverPortal {...portalProps}>
	<PopoverPrimitive.Content
		bind:ref
		data-slot="popover-content"
		{sideOffset}
		{align}
		class={cn(
			"bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 group/popover relative flex flex-col gap-2 rounded-[10px] px-3.5 py-3 text-[13px] shadow-[0_0_0_.5px_rgba(0,0,0,.14),0_10px_30px_rgba(0,0,0,.18)] dark:shadow-[0_0_0_.5px_rgba(255,255,255,.16),0_10px_30px_rgba(0,0,0,.5)] duration-100 z-50 w-[280px] origin-(--bits-popover-content-transform-origin) outline-hidden",
			className
		)}
		{...restProps}
	>
		<div
			data-slot="popover-arrow"
			aria-hidden="true"
			class={cn(
				"bg-popover pointer-events-none absolute -top-1.5 size-3 rotate-45 shadow-[-.5px_-.5px_0_rgba(0,0,0,.14)] group-data-[side=top]/popover:top-auto group-data-[side=top]/popover:-bottom-1.5 group-data-[side=top]/popover:shadow-[.5px_.5px_0_rgba(0,0,0,.14)] dark:shadow-[-.5px_-.5px_0_rgba(255,255,255,.16)]",
				align === "start" && "left-3.5",
				align === "end" && "right-3.5",
				align === "center" && "left-1/2 -translate-x-1/2"
			)}
		></div>
		{@render children?.()}
	</PopoverPrimitive.Content>
</PopoverPortal>
