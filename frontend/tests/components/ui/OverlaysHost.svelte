<script lang="ts">
	// ABOUTME: Test host rendering Popover, Tooltip and Drawer already open
	// ABOUTME: Lets overlays.test.ts inspect the real portalled content
	import * as Popover from '../../../src/lib/components/ui/popover/index.js';
	import * as Tooltip from '../../../src/lib/components/ui/tooltip/index.js';
	import * as Drawer from '../../../src/lib/components/ui/drawer/index.js';

	let { drawerDirection = 'right', popoverAlign = 'start', showClose = false }: {
		drawerDirection?: 'top' | 'bottom' | 'left' | 'right';
		popoverAlign?: 'start' | 'center' | 'end';
		showClose?: boolean;
	} = $props();
</script>

<Popover.Root open>
	<Popover.Trigger>Pop</Popover.Trigger>
	<Popover.Content align={popoverAlign}>Popover body</Popover.Content>
</Popover.Root>

<Tooltip.Provider>
	<Tooltip.Root open>
		<Tooltip.Trigger>Tip</Tooltip.Trigger>
		<Tooltip.Content>Tooltip text</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>

<Drawer.Root open direction={drawerDirection}>
	<Drawer.Content {showClose}>
		<Drawer.Header>
			<Drawer.Title>Drawer title</Drawer.Title>
			<Drawer.Description>Drawer description</Drawer.Description>
		</Drawer.Header>
		<Drawer.Footer>
			<button type="button">Done</button>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
