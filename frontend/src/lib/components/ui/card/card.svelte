<script lang="ts" module>
	import { tv } from "$lib/utils.js";

	// Run.dc.html and Workflow.dc.html cards: 10px corners, 13px type. Default is the white
	// candidate card; muted is the step list; success and destructive are the finished/failed heroes.
	export const cardVariants = tv({
		base: "text-card-foreground group/card flex flex-col gap-3 overflow-hidden rounded-xl py-(--card-spacing-y) text-body has-[>img:first-child]:pt-0",
		variants: {
			variant: {
				default: "bg-card shadow-card",
				muted: "bg-muted border border-border",
				success: "bg-success-subtle border border-success-border",
				destructive: "bg-destructive-surface border border-destructive-border",
			},
			size: {
				default: "[--card-spacing:--spacing(5)] [--card-spacing-y:18px] py-[18px]",
				sm: "[--card-spacing:--spacing(3)] [--card-spacing-y:--spacing(3)] py-3",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	});

	export type CardVariant = "default" | "muted" | "success" | "destructive";
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		variant = "default",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		size?: "default" | "sm";
		variant?: CardVariant;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	data-size={size}
	data-variant={variant}
	class={cn(cardVariants({ variant, size }), className)}
	{...restProps}
>
	{@render children?.()}
</div>
