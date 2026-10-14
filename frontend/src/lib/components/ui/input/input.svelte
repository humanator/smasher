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
	};

	const FIELD = "bg-background dark:bg-white/5 border-input aria-invalid:border-destructive focus-visible:border-primary focus-visible:ring-ring aria-invalid:ring-destructive/25 h-[24px] rounded-md border px-2 py-0 text-[13px] shadow-[inset_0_.5px_1px_rgba(0,0,0,.05)] transition-[color,box-shadow,background-color] file:h-5 file:text-[13px] file:font-medium focus-visible:ring-3 aria-invalid:ring-3 w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45";
	const SEARCH = "h-[28px] rounded-[7px] border-transparent bg-black/5 dark:bg-white/10 pl-[26px] shadow-none";

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		"data-slot": dataSlot = "input",
		search = false,
		...restProps
	}: Props = $props();
</script>

{#if type === "file"}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			FIELD,
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else if search}
	<span class="relative block w-full">
		<SearchIcon aria-hidden="true" class="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-[14px] -translate-y-1/2" />
		<input
			bind:this={ref}
			data-slot={dataSlot}
			class={cn(FIELD, SEARCH, className)}
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
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
