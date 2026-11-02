<script lang="ts">
	// ABOUTME: Test host that renders RunPage under the real Toolbar and page-header context, as App does
	// ABOUTME: Falls back to "Run" for the title like App, so tests can check the toolbar the page drives
	import type { ComponentProps } from 'svelte';
	import { providePageHeader } from '../../../src/lib/page-header.svelte';
	import Toolbar from '../../../src/components/shell/Toolbar.svelte';
	import RunPage from '../../../src/components/run/RunPage.svelte';

	let { runId, library }: ComponentProps<typeof RunPage> = $props();

	const header = providePageHeader();
</script>

<Toolbar
	title={header.title ?? 'Run'}
	subtitle={header.subtitle}
	back={header.back ?? { label: 'Smasher Pipelines', href: '/' }}
	titleAccessory={header.titleAccessory}
	actions={header.actions}
/>
<RunPage {runId} {library} />
