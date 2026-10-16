<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"relative inline-flex h-5 flex-none group-data-[full-width=true]/tabs-list:flex-1 items-center justify-center gap-1.5 rounded-sm border-0 px-3 text-body leading-none font-normal whitespace-nowrap text-foreground transition-colors group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45 [&_svg:not([class*='size-'])]:size-[13px] [&_svg]:pointer-events-none [&_svg]:shrink-0",
		"data-active:bg-segment data-active:font-medium data-active:shadow-segment",
		"group-data-[variant=line]/tabs-list:-mb-px group-data-[variant=line]/tabs-list:h-auto group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-0 group-data-[variant=line]/tabs-list:py-1.5 group-data-[variant=line]/tabs-list:leading-normal group-data-[variant=line]/tabs-list:text-muted-foreground group-data-[variant=line]/tabs-list:shadow-none group-data-[variant=line]/tabs-list:data-active:border-primary group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:font-semibold group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=line]/tabs-list:data-active:shadow-none dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
		"group-data-[variant=toolbar]/tabs-list:h-auto group-data-[variant=toolbar]/tabs-list:min-w-[72px] group-data-[variant=toolbar]/tabs-list:flex-col group-data-[variant=toolbar]/tabs-list:gap-0.5 group-data-[variant=toolbar]/tabs-list:rounded-md group-data-[variant=toolbar]/tabs-list:px-2 group-data-[variant=toolbar]/tabs-list:pt-[5px] group-data-[variant=toolbar]/tabs-list:pb-1 group-data-[variant=toolbar]/tabs-list:text-caption group-data-[variant=toolbar]/tabs-list:text-foreground-secondary group-data-[variant=toolbar]/tabs-list:[&_svg:not([class*='size-'])]:size-[22px] group-data-[variant=toolbar]/tabs-list:[&_svg]:text-muted-foreground group-data-[variant=toolbar]/tabs-list:data-active:bg-fill-pressed group-data-[variant=toolbar]/tabs-list:data-active:font-normal group-data-[variant=toolbar]/tabs-list:data-active:text-primary group-data-[variant=toolbar]/tabs-list:data-active:shadow-none group-data-[variant=toolbar]/tabs-list:data-active:[&_svg]:text-primary dark:group-data-[variant=toolbar]/tabs-list:data-active:text-primary-subtle-foreground dark:group-data-[variant=toolbar]/tabs-list:data-active:[&_svg]:text-primary-subtle-foreground",
		className
	)}
	{...restProps}
/>
