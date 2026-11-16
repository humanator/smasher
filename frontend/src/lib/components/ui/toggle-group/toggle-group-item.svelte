<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from "bits-ui";
	import { type ToggleVariants, toggleVariants } from "$lib/components/ui/toggle/index.js";
	import { cn } from "$lib/utils.js";
	import { getToggleGroupCtx } from "./toggle-group.svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		size,
		variant,
		...restProps
	}: ToggleGroupPrimitive.ItemProps & ToggleVariants = $props();

	const ctx = getToggleGroupCtx();
</script>

<ToggleGroupPrimitive.Item
	bind:ref
	data-slot="toggle-group-item"
	data-variant={ctx.variant || variant}
	data-size={ctx.size || size}
	data-spacing={ctx.spacing}
	class={cn(
		"shrink-0 focus:z-10 focus-visible:z-10 data-[variant=default]:data-[state=on]:bg-segment data-[variant=default]:data-[state=on]:font-medium data-[variant=default]:data-[state=on]:shadow-segment data-[variant=outline]:data-[state=on]:bg-primary data-[variant=outline]:data-[state=on]:font-medium data-[variant=outline]:data-[state=on]:text-primary-foreground",
		toggleVariants({
			variant: ctx.variant || variant,
			size: ctx.size || size,
		}),
		className
	)}
	{value}
	{...restProps}
/>
