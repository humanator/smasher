<script lang="ts">
	// ABOUTME: Test host that renders WorkflowDetailPage under the real Toolbar and page-header context, as App does
	// ABOUTME: Falls back to "Workflow" for the title like App, so tests can check the toolbar the page drives
	import type { ComponentProps } from 'svelte';
	import * as Tooltip from '../../../src/lib/components/ui/tooltip/index.js';
	import { providePageHeader } from '../../../src/lib/page-header.svelte';
	import Toolbar from '../../../src/components/shell/Toolbar.svelte';
	import WorkflowDetailPage from '../../../src/components/dashboard/WorkflowDetailPage.svelte';

	let { workflowId, library }: ComponentProps<typeof WorkflowDetailPage> = $props();

	const header = providePageHeader();
</script>

<Tooltip.Provider>
	<Toolbar
		title={header.title ?? 'Workflow'}
		subtitle={header.subtitle}
		back={header.back ?? { label: 'Smasher Pipelines', href: '/' }}
		actions={header.actions}
	/>
	<WorkflowDetailPage {workflowId} {library} />
</Tooltip.Provider>
