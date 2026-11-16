<script lang="ts">
	// ABOUTME: Test host rendering a Card with header, content and footer in a chosen variant and size
	// ABOUTME: Lets card.test.ts check the board surfaces (white, muted list, success, failed)
	import * as Card from '../../../src/lib/components/ui/card/index.js';

	let {
		variant = undefined,
		size = undefined,
	}: { variant?: 'default' | 'muted' | 'success' | 'destructive'; size?: 'default' | 'sm' } = $props();
</script>

<Card.Root {variant} {size} data-testid="card">
	<Card.Header>
		<Card.Title>Finished in 10 min 35 s</Card.Title>
		<Card.Description>All seven steps ran.</Card.Description>
	</Card.Header>
	<Card.Content>Body</Card.Content>
</Card.Root>
