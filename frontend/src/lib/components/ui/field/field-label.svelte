<script lang="ts">
	// ABOUTME: Field label: the Label primitive (13px/500) with a data-slot Field tests can find
	// ABOUTME: Pass `for` so clicking the label focuses the control
	import type { Label as LabelPrimitive } from "bits-ui";
	import Label from "../label/label.svelte";

	let { ref = $bindable(null), ...restProps }: LabelPrimitive.RootProps = $props();
</script>

<Label bind:ref data-slot="field-label" {...restProps} />
