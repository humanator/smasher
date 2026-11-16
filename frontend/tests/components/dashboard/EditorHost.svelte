<script lang="ts">
	// ABOUTME: Test host that renders WorkflowEditorPage under the real Toolbar and page-header context, as App does
	// ABOUTME: Falls back to "Workflow" for the title like App, so tests can check the toolbar the page drives
	import type { ComponentProps } from 'svelte';
	import { providePageHeader } from '../../../src/lib/page-header.svelte';
	import Toolbar from '../../../src/components/shell/Toolbar.svelte';
	import WorkflowEditorPage from '../../../src/components/dashboard/WorkflowEditorPage.svelte';

	let { workflowId, library }: ComponentProps<typeof WorkflowEditorPage> = $props();

	const header = providePageHeader();
</script>

<Toolbar
	title={header.title ?? 'Workflow'}
	subtitle={header.subtitle}
	subtitleDot={header.subtitleDot}
	subtitleLive={header.subtitleLive}
	back={header.back ?? { label: 'Smasher Pipelines', href: '/' }}
	actions={header.actions}
/>
<WorkflowEditorPage {workflowId} {library} />
