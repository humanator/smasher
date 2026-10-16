<script lang="ts">
	// ABOUTME: One radio, styled from the Checkbox board: 14px, hairline shadow, accent fill with a white dot
	// ABOUTME: Shares the checkbox's focus ring, systemRed invalid state and 45% disabled opacity
	import { RadioGroup as RadioGroupPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> = $props();
</script>

<RadioGroupPrimitive.Item
	bind:ref
	data-slot="radio-group-item"
	class={cn(
		"bg-control shadow-check data-[state=checked]:bg-primary data-[state=checked]:shadow-hairline aria-invalid:shadow-[inset_0_0_0_1px_var(--invalid),0_0_0_3px_var(--invalid-ring)] focus-visible:ring-ring peer relative grid size-[14px] shrink-0 place-items-center rounded-full border-0 outline-none transition-shadow focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-45",
		className
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		{#if checked}
			<span data-slot="radio-group-indicator" class="bg-primary-foreground size-1.5 rounded-full"></span>
		{/if}
	{/snippet}
</RadioGroupPrimitive.Item>
