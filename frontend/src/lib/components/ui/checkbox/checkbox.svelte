<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import CheckIcon from '@lucide/svelte/icons/check';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		"bg-background dark:bg-white/10 shadow-[inset_0_0_0_1px_rgba(0,0,0,.22),0_.5px_1px_rgba(0,0,0,.08)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,.25)] data-checked:bg-primary data-checked:text-primary-foreground data-checked:shadow-[inset_0_0_0_.5px_rgba(0,0,0,.15)] aria-invalid:shadow-[inset_0_0_0_1px_var(--destructive),0_0_0_3px_color-mix(in_srgb,var(--destructive)_25%,transparent)] focus-visible:ring-ring flex size-[14px] items-center justify-center rounded-[3.5px] border-0 transition-shadow focus-visible:ring-3 peer relative shrink-0 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-45",
		className
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div
			data-slot="checkbox-indicator"
			class="[&>svg]:size-[11px] [&>svg]:stroke-[3] grid place-content-center text-current transition-none"
		>
			{#if checked}
				<CheckIcon  />
			{:else if indeterminate}
				<MinusIcon  />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
