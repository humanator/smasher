<script lang="ts">
	// ABOUTME: Test host that feeds ActivityLog the way RunPage does: one SSE subscription filling the event store
	// ABOUTME: A new runId starts from an empty store, as the page does when the run changes
	import * as eventsApi from '../../../src/lib/api/events';
	import { eventStore } from '../../../src/stores/events.svelte';
	import ActivityLog from '../../../src/components/run/ActivityLog.svelte';

	let { runId, labels }: { runId: string; labels?: ReadonlyMap<string, string> } = $props();

	// Derived, so setting the same runId again doesn't restart the stream.
	const streamRunId = $derived(runId);

	$effect(() => {
		const id = streamRunId;
		eventStore.clear();
		const unsubscribe = eventsApi.subscribeToPipelineEvents(id, (event) => eventStore.add(event));
		return () => {
			unsubscribe();
			eventStore.clear();
		};
	});
</script>

<ActivityLog events={eventStore.events} {labels} />
