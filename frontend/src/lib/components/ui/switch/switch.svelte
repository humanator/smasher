<script lang="ts">
	import { Switch as SwitchPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		size = "default",
		...restProps
	}: WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
		size?: "sm" | "default";
	} = $props();
</script>

<SwitchPrimitive.Root
	bind:ref
	bind:checked
	data-slot="switch"
	data-size={size}
	class={cn(
		"data-checked:bg-primary data-unchecked:bg-track shadow-hairline aria-invalid:ring-invalid-ring focus-visible:ring-ring shrink-0 rounded-full border-0 p-px focus-visible:ring-3 aria-invalid:ring-3 data-[size=default]:h-[22px] data-[size=default]:w-[38px] data-[size=sm]:h-[15px] data-[size=sm]:w-[26px] peer group/switch relative inline-flex items-center transition-colors duration-150 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 data-disabled:cursor-not-allowed data-disabled:opacity-45",
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class={cn(
			"bg-white rounded-full shadow-thumb group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-[13px] group-data-[size=default]/switch:data-checked:translate-x-4 group-data-[size=sm]/switch:data-checked:translate-x-[11px] data-unchecked:translate-x-0 pointer-events-none block ring-0 transition-transform duration-150"
		)}
	/>
</SwitchPrimitive.Root>
