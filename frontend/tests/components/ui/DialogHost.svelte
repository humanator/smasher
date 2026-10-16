<script lang="ts">
	// ABOUTME: Test host rendering an open Dialog in a chosen variant
	// ABOUTME: Lets dialog.test.ts check the sheet, window and fullscreen surfaces from Home.dc.html
	import * as Dialog from '../../../src/lib/components/ui/dialog/index.js';

	let {
		variant = undefined,
		showCloseButton = undefined,
	}: { variant?: 'sheet' | 'window' | 'fullscreen'; showCloseButton?: boolean } = $props();
</script>

<Dialog.Root open>
	<Dialog.Content {variant} {showCloseButton}>
		<Dialog.Header>
			<Dialog.Title>Run “Design review”</Dialog.Title>
			<Dialog.Description>Everything here is optional.</Dialog.Description>
		</Dialog.Header>
		<p>Body</p>
	</Dialog.Content>
</Dialog.Root>
