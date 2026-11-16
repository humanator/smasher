<script lang="ts" module>
	import type { VariantProps } from "tailwind-variants";
	import { tv } from "$lib/utils.js";

	export const tabsListVariants = tv({
		base: "group/tabs-list inline-flex w-fit items-center text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
		variants: {
			variant: {
				default: "rounded-track bg-secondary p-0.5",
				line: "gap-[18px] border-b border-border-strong bg-transparent",
				// Preference-window section switcher: icon over caption, no track (Home.dc.html Settings).
				toolbar: "gap-1 bg-transparent p-0",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type TabsListVariant = VariantProps<typeof tabsListVariants>["variant"];
</script>

<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		variant = "default",
		fullWidth = false,
		class: className,
		...restProps
	}: TabsPrimitive.ListProps & {
		variant?: TabsListVariant;
		/** Stretch the segments to fill the row; by default each sizes to its label. */
		fullWidth?: boolean;
	} = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	data-variant={variant}
	data-full-width={fullWidth || undefined}
	class={cn(tabsListVariants({ variant }), fullWidth && "w-full", className)}
	{...restProps}
/>
