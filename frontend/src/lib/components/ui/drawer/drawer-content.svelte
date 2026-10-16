<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import XIcon from "@lucide/svelte/icons/x";
	import { cn } from "$lib/utils.js";
	import type { WithoutChildrenOrChild } from "$lib/utils.js";
	import DrawerOverlay from "./drawer-overlay.svelte";
	import DrawerPortal from "./drawer-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		showClose = false,
		...restProps
	}: DrawerPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DrawerPortal>>;
		/** The board's optional round close button, top right. */
		showClose?: boolean;
	} = $props();
</script>

<DrawerPortal {...portalProps}>
	<DrawerOverlay />
	<DrawerPrimitive.Content
		bind:ref
		data-slot="drawer-content"
		class={cn(
			"flex h-auto flex-col px-5 pt-[18px] pb-4 text-body text-foreground group/drawer-content fixed z-50 after:hidden data-[vaul-drawer-direction=bottom]:left-1/2 data-[vaul-drawer-direction=bottom]:-translate-x-1/2 data-[vaul-drawer-direction=bottom]:top-10 data-[vaul-drawer-direction=bottom]:w-[calc(100%_-_48px)] data-[vaul-drawer-direction=bottom]:max-w-[420px] data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-2xl data-[vaul-drawer-direction=bottom]:bg-popover data-[vaul-drawer-direction=bottom]:shadow-sheet data-[vaul-drawer-direction=top]:left-1/2 data-[vaul-drawer-direction=top]:-translate-x-1/2 data-[vaul-drawer-direction=top]:top-10 data-[vaul-drawer-direction=top]:w-[calc(100%_-_48px)] data-[vaul-drawer-direction=top]:max-w-[420px] data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-2xl data-[vaul-drawer-direction=top]:bg-popover data-[vaul-drawer-direction=top]:shadow-sheet data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:start-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:max-w-[300px] data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:border-border-strong data-[vaul-drawer-direction=left]:bg-muted data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:end-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:max-w-[300px] data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:border-border-strong data-[vaul-drawer-direction=right]:bg-muted",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		{#if showClose}
			<DrawerPrimitive.Close
				data-slot="drawer-close"
				class="bg-secondary text-foreground-control hover:bg-fill-pressed focus-visible:ring-ring absolute top-4 right-4 grid size-[22px] place-items-center rounded-full outline-none focus-visible:ring-3"
			>
				<XIcon class="size-2.5" stroke-width={3} aria-hidden="true" />
				<span class="sr-only">Close</span>
			</DrawerPrimitive.Close>
		{/if}
	</DrawerPrimitive.Content>
</DrawerPortal>
