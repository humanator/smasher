<script lang="ts">
	// ABOUTME: Test host that renders NewWorkflowPage under the real Toolbar and page-header context, as App does
	// ABOUTME: Falls back to App's own back link, so tests can check the title and back the page sets
	import { providePageHeader } from '../../../src/lib/page-header.svelte';
	import Toolbar from '../../../src/components/shell/Toolbar.svelte';
	import NewWorkflowPage from '../../../src/components/dashboard/NewWorkflowPage.svelte';

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
<NewWorkflowPage />
