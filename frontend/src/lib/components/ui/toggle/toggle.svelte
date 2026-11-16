<script lang="ts" module>
	import type { VariantProps } from "tailwind-variants";
	import { tv } from "$lib/utils.js";

	export const toggleVariants = tv({
		base: "hover:text-foreground aria-pressed:bg-secondary focus-visible:ring-ring aria-invalid:ring-invalid-ring aria-invalid:border-invalid gap-1 rounded-sm text-body leading-none font-normal text-foreground transition-colors [&_svg:not([class*='size-'])]:size-[13px] group/toggle inline-flex items-center justify-center whitespace-nowrap outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			variant: {
				default: "bg-transparent",
				outline: "bg-transparent",
			},
			size: {
				default: "h-5 min-w-5 px-[11px]",
				sm: "h-[18px] min-w-[18px] px-[11px] text-small",
				lg: "h-6 min-w-6 px-[14px]",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ToggleVariant = VariantProps<typeof toggleVariants>["variant"];
	export type ToggleSize = VariantProps<typeof toggleVariants>["size"];
	export type ToggleVariants = VariantProps<typeof toggleVariants>;
</script>

<script lang="ts">
	import { Toggle as TogglePrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		pressed = $bindable(false),
		class: className,
		size = "default",
		variant = "default",
		...restProps
	}: TogglePrimitive.RootProps & {
		variant?: ToggleVariant;
		size?: ToggleSize;
	} = $props();
</script>

<TogglePrimitive.Root
	bind:ref
	bind:pressed
	data-slot="toggle"
	class={cn(toggleVariants({ variant, size }), className)}
	{...restProps}
/>
