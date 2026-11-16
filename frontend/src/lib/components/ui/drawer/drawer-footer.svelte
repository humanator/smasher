<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="drawer-footer"
	class={cn("mt-auto flex flex-row justify-end gap-2 pt-[18px] [&>*]:min-w-[72px]", className)}
	{...restProps}
>
	{@render children?.()}
</div>
