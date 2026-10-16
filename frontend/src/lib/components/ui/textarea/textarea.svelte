<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLTextareaAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		"data-slot": dataSlot = "textarea",
		mono = false,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> & {
		/** Code-like values (name=value lines, JSON): 12px monospace. */
		mono?: boolean;
	} = $props();
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		"bg-field border-input aria-invalid:border-invalid focus-visible:border-primary focus-visible:ring-ring-field aria-invalid:ring-invalid-ring resize-y rounded-md border px-2 py-[5px] text-body leading-[1.45] shadow-field transition-[color,box-shadow,background-color] focus-visible:ring-3 aria-invalid:ring-3 flex field-sizing-content min-h-[52px] w-full outline-none placeholder:text-foreground-tertiary disabled:cursor-not-allowed disabled:opacity-45",
		mono && "font-mono text-small",
		className
	)}
	bind:value
	{...restProps}></textarea>
