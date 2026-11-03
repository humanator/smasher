<script lang="ts">
	// ABOUTME: Test host that renders WorkflowCanvas under the real Toolbar and page-header context, as App does
	// ABOUTME: Lets tests read the save-state subtitle and use the toolbar controls the canvas places there
	import type { ComponentProps } from 'svelte';
	import { providePageHeader } from '../../../src/lib/page-header.svelte';
	import Toolbar from '../../../src/components/shell/Toolbar.svelte';
	import WorkflowCanvas from '../../../src/components/node-editor/WorkflowCanvas.svelte';

	let {
		graph,
		workflowId,
		availableTargetDirs,
		onSave,
		onExport,
		onCanvas,
	}: ComponentProps<typeof WorkflowCanvas> & { onCanvas?: (canvas: ReturnType<typeof WorkflowCanvas>) => void } =
		$props();

	const header = providePageHeader();
	let canvas = $state<ReturnType<typeof WorkflowCanvas>>();
	$effect(() => {
		if (canvas) onCanvas?.(canvas);
	});
</script>

<Toolbar
	title={header.title ?? 'Workflow'}
	subtitle={header.subtitle}
	subtitleDot={header.subtitleDot}
	subtitleLive={header.subtitleLive}
	back={header.back}
	actions={header.actions}
/>
<WorkflowCanvas bind:this={canvas} {graph} {workflowId} {availableTargetDirs} {onSave} {onExport} />
