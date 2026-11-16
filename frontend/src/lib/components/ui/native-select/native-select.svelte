<script lang="ts">
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLSelectAttributes } from "svelte/elements";

	type NativeSelectProps = Omit<WithElementRef<HTMLSelectAttributes>, "size"> & {
		size?: "sm" | "default";
	};

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		size = "default",
		children,
		...restProps
	}: NativeSelectProps = $props();
</script>

<div
	class={cn(
		"group/native-select relative w-full has-[select:disabled]:opacity-45",
		className
	)}
	data-slot="native-select-wrapper"
	data-size={size}
>
	<select
		bind:value
		bind:this={ref}
		data-slot="native-select"
		data-size={size}
		class="bg-control placeholder:text-foreground-tertiary selection:bg-primary selection:text-primary-foreground focus-visible:ring-ring aria-invalid:ring-invalid-ring h-[24px] w-full min-w-0 appearance-none rounded-md border-0 py-0 pr-7 pl-[9px] text-body shadow-push transition-[color,box-shadow,background-color] select-none focus-visible:ring-3 focus-visible:shadow-none aria-invalid:shadow-[0_0_0_1px_var(--invalid)] aria-invalid:ring-3 data-[size=sm]:h-[22px] outline-none disabled:pointer-events-none disabled:cursor-not-allowed"
		{...restProps}
	>
		{@render children?.()}
	</select>
	<span
		aria-hidden="true"
		data-slot="native-select-icon"
		class="bg-primary pointer-events-none absolute top-1/2 right-1 grid size-4 -translate-y-1/2 place-items-center rounded-xs select-none"
	>
		<ChevronsUpDownIcon class="text-primary-foreground size-2.5" stroke-width={3} />
	</span>
</div>
