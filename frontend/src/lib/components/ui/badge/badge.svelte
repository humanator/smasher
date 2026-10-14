<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "h-[18px] gap-[5px] rounded-full border-0 px-[7px] text-[11px] leading-none font-medium transition-colors [&>svg]:size-3! group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap focus-visible:ring-3 focus-visible:ring-ring aria-invalid:ring-3 aria-invalid:ring-destructive/30 [&>svg]:pointer-events-none",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground",
				secondary: "bg-secondary text-secondary-foreground",
				destructive: "bg-destructive-subtle text-destructive",
				outline: "text-foreground shadow-[inset_0_0_0_1px_var(--input)]",
				ghost: "text-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		dot,
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
		/** Optional CSS colour for a leading status dot. */
		dot?: string;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{#if dot}
		<span data-slot="badge-dot" aria-hidden="true" class="size-1.5 flex-none rounded-full" style:background={dot}></span>
	{/if}
	{@render children?.()}
</svelte:element>
