<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
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
		"group/native-select relative w-fit has-[select:disabled]:opacity-45",
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
		class="bg-background dark:bg-white/10 placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground focus-visible:ring-ring aria-invalid:ring-destructive/25 h-[24px] w-full min-w-0 appearance-none rounded-md border-0 py-0 pr-7 pl-[9px] text-[13px] shadow-[0_0_0_.5px_rgba(0,0,0,.16),0_.5px_1.5px_rgba(0,0,0,.14)] transition-[color,box-shadow,background-color] select-none focus-visible:ring-3 aria-invalid:shadow-[0_0_0_1px_var(--destructive)] aria-invalid:ring-3 data-[size=sm]:h-[22px] outline-none disabled:pointer-events-none disabled:cursor-not-allowed"
		{...restProps}
	>
		{@render children?.()}
	</select>
	<ChevronDownIcon class="text-primary top-1/2 right-2 size-[13px] -translate-y-1/2 pointer-events-none absolute select-none" aria-hidden data-slot="native-select-icon" />
</div>
