<script lang="ts">
	// ABOUTME: Test host that renders WorkflowEdge inside a real SvelteFlow, so its path, label pill and selection run
	// ABOUTME: Nodes carry explicit width/height/handles, which SvelteFlow uses where jsdom can't measure the DOM
	import { Position, SvelteFlow, type Edge, type Node, type NodeHandle } from '@xyflow/svelte';
	import { setContext } from 'svelte';
	import WorkflowEdge from '../../../src/components/node-editor/WorkflowEdge.svelte';
	import { EDGE_ACTIONS_CONTEXT_KEY, type WorkflowEdgeActions } from '../../../src/components/node-editor/edgeContext';

	let { initialEdges, onSelectEdge }: { initialEdges: Edge[]; onSelectEdge: (edgeId: string) => void } = $props();

	const handles: NodeHandle[] = [
		{ type: 'source', position: Position.Bottom, x: 129, y: 95, width: 2, height: 2 },
		{ type: 'target', position: Position.Top, x: 129, y: -1, width: 2, height: 2 },
	];
	let nodes = $state.raw<Node[]>([
		{ id: 'a', position: { x: 0, y: 0 }, width: 260, height: 96, handles, data: { label: 'Draft' } },
		{ id: 'b', position: { x: 200, y: 300 }, width: 260, height: 96, handles, data: { label: 'Check' } },
	]);
	// svelte-ignore state_referenced_locally
	let edges = $state.raw<Edge[]>(initialEdges);

	const edgeActions: WorkflowEdgeActions = {
		onSelectEdge: (edgeId) => onSelectEdge(edgeId),
		onDeleteEdge: (edgeId) => (edges = edges.filter((e) => e.id !== edgeId)),
	};
	setContext(EDGE_ACTIONS_CONTEXT_KEY, edgeActions);

	export function currentEdges(): Edge[] {
		return edges;
	}

	export function setEdges(next: Edge[]) {
		edges = next;
	}
</script>

<div style="width: 800px; height: 600px">
	<SvelteFlow bind:nodes bind:edges edgeTypes={{ workflow: WorkflowEdge }} />
</div>
