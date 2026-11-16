<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import SearchIcon from "@lucide/svelte/icons/search";
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";

	type InputType = Exclude<HTMLInputTypeAttribute, "file">;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, "type"> &
			({ type: "file"; files?: FileList } | { type?: InputType; files?: undefined })
	> & {
		/** Toolbar search field: 28px, filled, with a leading magnifier. */
		search?: boolean;
		/** Code-like values (keys, name=value lines): 12px monospace. */
		mono?: boolean;
	};

	const FIELD = "bg-field border-input aria-invalid:border-invalid focus-visible:border-primary focus-visible:ring-ring-field aria-invalid:ring-invalid-ring h-[24px] rounded-md border px-2 py-0 text-body shadow-field transition-[color,box-shadow,background-color] file:h-5 file:text-body file:font-medium focus-visible:ring-3 aria-invalid:ring-3 w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent file:text-foreground placeholder:text-foreground-tertiary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45";
	const SEARCH = "h-[28px] rounded-track border-transparent bg-field-fill pl-[26px] shadow-none";
	const MONO = "font-mono text-small";

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		"data-slot": dataSlot = "input",
		search = false,
		mono = false,
		...restProps
	}: Props = $props();
</script>

{#if type === "file"}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			FIELD,
			mono && MONO,
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else if search}
	<span class="relative block w-full">
		<SearchIcon aria-hidden="true" stroke-width={2.2} class="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-[13px] -translate-y-1/2" />
		<input
			bind:this={ref}
			data-slot={dataSlot}
			class={cn(FIELD, SEARCH, mono && MONO, className)}
			{type}
			bind:value
			{...restProps}
		/>
	</span>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			FIELD,
			mono && MONO,
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
