<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

	export const buttonVariants = tv({
		base: "focus-visible:ring-ring aria-invalid:ring-destructive/30 aria-invalid:border-destructive rounded-md border-0 bg-clip-padding text-[13px] leading-none font-normal tracking-[-0.005em] focus-visible:ring-3 aria-invalid:ring-3 active:not-aria-[haspopup]:translate-y-px [&_svg:not([class*='size-'])]:size-[13px] group/button inline-flex shrink-0 items-center justify-center gap-[5px] whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground font-medium shadow-[0_0_0_.5px_rgba(0,0,0,.14),0_.5px_1.5px_rgba(0,0,0,.18),inset_0_.5px_0_rgba(255,255,255,.22)] hover:brightness-110 active:brightness-95",
				outline: "bg-background text-foreground shadow-[0_0_0_.5px_rgba(0,0,0,.16),0_.5px_1.5px_rgba(0,0,0,.14)] dark:bg-white/10 dark:shadow-[0_0_0_.5px_rgba(255,255,255,.16)] hover:bg-muted aria-expanded:bg-muted",
				secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--secondary),var(--foreground)_6%)] aria-expanded:bg-secondary",
				ghost: "text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground aria-pressed:bg-accent aria-pressed:text-foreground",
				destructive: "bg-background text-destructive shadow-[0_0_0_.5px_rgba(0,0,0,.16),0_.5px_1.5px_rgba(0,0,0,.14)] dark:bg-white/10 dark:shadow-[0_0_0_.5px_rgba(255,255,255,.16)] hover:bg-destructive-subtle",
				link: "text-primary px-0! underline-offset-4 hover:underline",
			},
			size: {
				default: "h-[24px] px-[11px]",
				xs: "h-[18px] rounded-[5px] px-[7px] text-[11px] [&_svg:not([class*='size-'])]:size-[11px]",
				sm: "h-[22px] px-[9px]",
				lg: "h-[28px] px-[14px]",
				icon: "size-[28px] [&_svg:not([class*='size-'])]:size-4",
				"icon-xs": "size-[18px] rounded-[5px] [&_svg:not([class*='size-'])]:size-[11px]",
				"icon-sm": "size-[24px]",
				"icon-lg": "size-[32px] [&_svg:not([class*='size-'])]:size-4",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
