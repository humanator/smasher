<script lang="ts">
  // ABOUTME: A candidate's screenshot thumbnail, opening a lightbox with the live bundle at full size
  // ABOUTME: Shared by CandidateCard and GalleryGate; the lightbox scales the capture viewport to fit

  import type { CandidateResponse } from '../../lib/api/runs';
  import { fitScale, viewportOf } from '../../lib/previewScale';
  import * as Dialog from '$lib/components/ui/dialog/index.js';

  let { candidate }: { candidate: CandidateResponse } = $props();

  let open = $state(false);
  // The lightbox mounts its own <img>, so each image has its own failed flag.
  let thumbnailFailed = $state(false);
  let fullSizeFailed = $state(false);
  let stageWidth = $state(0);
  let stageHeight = $state(0);

  const viewport = $derived(viewportOf(candidate.manifest));
  // An unmeasured stage (jsdom, or a browser's first frame) reads 0, and a 0 scale hides everything.
  const scale = $derived(
    stageWidth > 0 && stageHeight > 0
      ? fitScale(viewport, { width: stageWidth, height: stageHeight })
      : 1
  );
  const sizeStyle = $derived(`width: ${viewport.width}px; height: ${viewport.height}px`);
  const scaledStyle = $derived(
    `${sizeStyle}; transform: scale(${scale}); transform-origin: top left`
  );

  function openLightbox(event: MouseEvent) {
    // At the gate the card is a <label>; keep this click from reaching it.
    event.preventDefault();
    event.stopPropagation();
    open = true;
  }
</script>

<button
  type="button"
  aria-label="Open preview of {candidate.candidate_id}"
  class="candidate-thumbnail block w-full cursor-zoom-in overflow-hidden rounded bg-muted"
  style="aspect-ratio: {viewport.width} / {viewport.height}"
  onclick={openLightbox}
>
  {#if thumbnailFailed}
    <span class="flex size-full items-center justify-center text-xs text-muted-foreground">
      No screenshot
    </span>
  {:else}
    <img
      src={candidate.screenshot_url}
      alt="Candidate {candidate.candidate_id}"
      class="size-full object-cover object-top"
      onerror={() => (thumbnailFailed = true)}
    />
  {/if}
</button>

<Dialog.Root bind:open>
  <Dialog.Content
    class="flex h-[calc(100vh-2rem)] flex-col gap-3 p-4 sm:max-w-[calc(100vw-2rem)]"
  >
    <Dialog.Header class="pr-10">
      <Dialog.Title class="font-mono">{candidate.candidate_id}</Dialog.Title>
    </Dialog.Header>
    <div
      class="flex min-h-0 flex-1 items-start justify-center overflow-hidden"
      bind:clientWidth={stageWidth}
      bind:clientHeight={stageHeight}
    >
      <!-- Sized to the scaled content, so the transform leaves no phantom space. -->
      <div
        class="overflow-hidden rounded"
        style="width: {viewport.width * scale}px; height: {viewport.height * scale}px"
      >
        {#if candidate.bundle_url}
          <iframe
            src={candidate.bundle_url}
            title="Candidate {candidate.candidate_id}"
            sandbox="allow-scripts"
            class="border-none bg-white"
            style={scaledStyle}
          ></iframe>
        {:else if fullSizeFailed}
          <div
            class="flex items-center justify-center bg-muted text-sm text-muted-foreground"
            style={scaledStyle}
          >
            No screenshot
          </div>
        {:else}
          <img
            src={candidate.screenshot_url}
            alt="Candidate {candidate.candidate_id}"
            class="max-w-none"
            style={scaledStyle}
            onerror={() => (fullSizeFailed = true)}
          />
        {/if}
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
