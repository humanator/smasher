<script lang="ts">
	// ABOUTME: Test host wrapping SourceList in the sidebar Provider it needs
	// ABOUTME: Passes plain props straight through so tests need no network
	import * as Sidebar from '../../../src/lib/components/ui/sidebar/index.js';
	import SourceList from '../../../src/components/shell/SourceList.svelte';
	import type { ComponentProps } from 'svelte';

	let { workflows, runCount, needsYouCount, currentWorkflowId, native }: ComponentProps<typeof SourceList> = $props();
</script>

<Sidebar.Provider>
	<SourceList {workflows} {runCount} {needsYouCount} {currentWorkflowId} {native} />
</Sidebar.Provider>
