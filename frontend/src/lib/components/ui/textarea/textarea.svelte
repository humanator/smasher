<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLTextareaAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		"data-slot": dataSlot = "textarea",
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		"bg-background dark:bg-white/5 border-input aria-invalid:border-destructive focus-visible:border-primary focus-visible:ring-ring aria-invalid:ring-destructive/25 resize-y rounded-md border px-2 py-[5px] text-[13px] leading-[1.45] shadow-[inset_0_.5px_1px_rgba(0,0,0,.05)] transition-[color,box-shadow,background-color] focus-visible:ring-3 aria-invalid:ring-3 flex field-sizing-content min-h-[52px] w-full outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-45",
		className
	)}
	bind:value
	{...restProps}></textarea>
