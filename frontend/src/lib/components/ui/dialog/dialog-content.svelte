<script lang="ts" module>
	import { tv } from "$lib/utils.js";

	// Home.dc.html draws three window kinds. All sit on the sheet surface with 12px corners and are
	// top-aligned like macOS sheets; they differ in width, padding, shadow and scrim.
	export const dialogContentVariants = tv({
		base: "bg-sheet text-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 fixed left-1/2 z-50 w-full max-w-[calc(100%_-_2rem)] -translate-x-1/2 rounded-2xl text-body duration-100 outline-none",
		variants: {
			variant: {
				// Run sheet: 520px, 20px padding, 16px between header, fields and footer.
				sheet: "top-10 grid max-h-[calc(100vh_-_5rem)] gap-4 overflow-y-auto p-5 shadow-dialog sm:max-w-[520px]",
				// Settings: 620px preference window with its own toolbar header, so no padding.
				window: "top-[60px] flex max-h-[calc(100vh_-_7.5rem)] flex-col gap-0 overflow-hidden p-0 shadow-window sm:max-w-[620px]",
				// Candidate lightbox: fills the viewport less a 16px margin.
				fullscreen: "top-4 flex h-[calc(100vh_-_2rem)] flex-col gap-3 p-4 shadow-dialog sm:max-w-[calc(100vw_-_2rem)]",
			},
		},
		defaultVariants: { variant: "sheet" },
	});

	const SCRIM = { sheet: "bg-scrim", window: "bg-scrim-faint", fullscreen: "bg-scrim-strong" } as const;

	export type DialogContentVariant = keyof typeof SCRIM;
</script>

<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import XIcon from '@lucide/svelte/icons/x';
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";
	import * as Dialog from "./index.js";
	import DialogPortal from "./dialog-portal.svelte";
	import type { Snippet } from "svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		showCloseButton = true,
		variant = "sheet",
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>;
		children: Snippet;
		showCloseButton?: boolean;
		variant?: DialogContentVariant;
	} = $props();
</script>

<DialogPortal {...portalProps}>
	<Dialog.Overlay class={SCRIM[variant]} />
	<DialogPrimitive.Content
		bind:ref
		data-slot="dialog-content"
		data-variant={variant}
		class={cn(dialogContentVariants({ variant }), className)}
		{...restProps}
	>
		{@render children?.()}
		{#if showCloseButton}
			<DialogPrimitive.Close
				data-slot="dialog-close"
				class="bg-secondary text-foreground-control hover:bg-fill-pressed focus-visible:ring-ring absolute top-3.5 right-3.5 grid size-[22px] place-items-center rounded-full outline-none focus-visible:ring-3"
			>
				<XIcon class="size-2.5" stroke-width={3} aria-hidden="true" />
				<span class="sr-only">Close</span>
			</DialogPrimitive.Close>
		{/if}
	</DialogPrimitive.Content>
</DialogPortal>
