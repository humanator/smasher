<script lang="ts">
	// ABOUTME: Test host rendering the Tabs primitives with two tabs
	// ABOUTME: Lets tabs.test.ts exercise the real components with a chosen list variant
	import * as Tabs from '../../../src/lib/components/ui/tabs/index.js';

	let { variant = 'default', fullWidth = false }: { variant?: 'default' | 'line' | 'toolbar'; fullWidth?: boolean } = $props();
</script>

<Tabs.Root value="a">
	<Tabs.List {variant} {fullWidth}>
		<Tabs.Trigger value="a">Alpha</Tabs.Trigger>
		<Tabs.Trigger value="b">Beta</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="a">Alpha body</Tabs.Content>
	<Tabs.Content value="b">Beta body</Tabs.Content>
</Tabs.Root>
