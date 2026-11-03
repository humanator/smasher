<script lang="ts">
  // ABOUTME: Canvas legend, bottom-left: what a plain connection and a dashed loop connection mean
  // ABOUTME: Line samples match WorkflowEdge's strokes (the edge stroke token and the warning ink)
</script>

<div
  class="pointer-events-none absolute bottom-3 left-3.5 z-10 flex flex-col gap-1.25 rounded-lg bg-card/90 px-3 py-2 text-caption text-foreground-secondary shadow-tooltip"
>
  <span class="flex items-center gap-2">
    <span class="w-5 border-t-2 border-muted-foreground" aria-hidden="true"></span>Then run the next step
  </span>
  <span class="flex items-center gap-2">
    <span class="w-5 border-t-2 border-dashed border-warning-foreground" aria-hidden="true"></span>Go back and redo (a loop)
  </span>
</div>
