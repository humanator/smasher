<script lang="ts">
	// ABOUTME: Test host rendering the Accordion primitives with two items
	// ABOUTME: Lets accordion.test.ts exercise the real components
	import * as Accordion from '../../../src/lib/components/ui/accordion/index.js';
</script>

<Accordion.Root type="single" value="one">
	<Accordion.Item value="one">
		<Accordion.Trigger>First</Accordion.Trigger>
		<Accordion.Content>First body</Accordion.Content>
	</Accordion.Item>
	<Accordion.Item value="two">
		<Accordion.Trigger>Second</Accordion.Trigger>
		<Accordion.Content>Second body</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>
