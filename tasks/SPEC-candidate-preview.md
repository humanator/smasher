# Spec: candidate-preview

Module of [`capability-map-spa-repairs.md`](capability-map-spa-repairs.md), after `spa-shell`.
Fixes `BACKLOG.md` #9 (candidate thumbnails and lightbox) and the parts of #21 that live on the
candidate card: the ⟲ reset, the params section and captured-at on failed cards.

## Objective

Someone judging design-factory candidates, in the run's gallery or at a gallery gate, should see
each candidate as a screenshot thumbnail and be able to open it full size to click through. Today
each card squeezes a live 4:3 iframe into a column at least 260px wide. That's too small to judge a
design captured at 1280×800, and a gate with N candidates runs N live bundles at once.

What the old UI did (`git show 0e5647c^:crates/smasher-web/templates/<file>`):

- **`_candidate_card.html` `live_card`.** A live iframe of the bundle (`sandbox="allow-scripts"`),
  or the screenshot if there was no bundle. It had a ⟲ button (`aria-label="Reset preview to
  start"`) and a collapsed `<details>` headed `params`, one `key: value` row per
  `generation_params` entry, left out when empty.
- **`failed_card(c, show_captured_at)`.** Candidate id, then `captured_at`, then the failure
  reason. The gallery passed `show_captured_at = true` and the gate passed `false`.
- **`base.html`.** ⟲ removed the iframe's `src` and set it again from `data-src`, calling
  `preventDefault` and `stopPropagation` so the click didn't reach the gate's link. It never
  touched `contentWindow`, because the sandbox lacks `allow-same-origin`.
- **`gallery_gate.html`.** Wrapped the preview in `<a href="{primary_url}" target="_blank">`.
  `primary_url` is the bundle, or the screenshot when there's no bundle.

What the SPA does today:

- `CandidateCard.svelte` (used by `CandidateGallery`) and the inline card in `GalleryGate.svelte`
  both show a 4:3 live iframe when there's a `bundle_url` and the screenshot otherwise. Neither has
  ⟲, params or a link-out. `CandidateCard` shows `captured_at` on live cards only. The gate's card
  is a `<label>` wrapping the checkbox, so a click anywhere on it toggles the selection.
- The API already sends everything needed. Each candidate has `screenshot_url` (always set, even
  when the file doesn't exist), an optional `bundle_url`, and `manifest` with `captured_at`,
  `viewport` (`{width, height}`, 1280×800 from render-capture), `exit_status` and
  `generation_params` (`BTreeMap<String, String>`).

### User stories and acceptance criteria

1. **Each live candidate shows as a screenshot thumbnail.**
   - Live (non-failed) cards in both `CandidateGallery` and `GalleryGate` show `screenshot_url` as
     an `<img alt="Candidate {id}">`, in a box with the manifest viewport's aspect ratio (16:10
     for 1280×800, or 16:10 when `viewport` is missing). The image is top-aligned with
     `object-cover`.
   - No card renders an `<iframe>`.
   - The thumbnail is a `<button aria-label="Open preview of {id}">`, reachable by keyboard.
2. **A missing screenshot shows a placeholder.** If the image fails to load, the box shows a muted
   tile reading `No screenshot`. The button still works and opens the lightbox.
3. **Clicking the thumbnail opens a full-size, interactive lightbox.**
   - It's a dialog titled with the candidate id.
   - **With a bundle.** It shows the bundle in an `<iframe sandbox="allow-scripts"
     title="Candidate {id}">` laid out at the manifest viewport size (default 1280×800). It's
     scaled down with a CSS transform to fit the window, never scaled up, and it rescales when
     the window resizes. The iframe stays clickable.
   - **Without a bundle.** It shows the full-size screenshot, scaled to fit the same way, or
     `No screenshot` if the image fails to load. There's no ⟲.
   - It has an **Open in new tab** link (`target="_blank" rel="noopener"`) to the bundle, or to
     the screenshot when there's no bundle.
   - Escape, the close button and clicking the overlay all close it.
4. **⟲ resets the live preview to its start state.**
   - With a bundle, the lightbox has a `⟲` button (`aria-label="Reset preview to start"`) that
     reloads the iframe from `bundle_url`, dropping any state the user created by clicking around.
   - Nothing reaches into the iframe's `contentWindow`.
5. **Params are listed on the card.**
   - When `generation_params` has entries, live cards in both views show a collapsed `<details>`
     with summary `params`. Inside, one row per entry reads `{key}: {value}`, in the API's order
     (sorted by key).
   - When it's empty or missing, there's no params section.
6. **Failed cards in the gallery show when they were captured.**
   - `CandidateCard`'s failed card shows the candidate id, then `captured_at`, then the reason.
   - The gate's failed card doesn't show `captured_at`, as before.
   - `captured_at` is displayed as the raw string, as live cards already do.
7. **The gate's card still works as before.**
   - The checkbox, scorecard badges and comment box stay on the card and behave as they do today.
   - Clicking the thumbnail opens the lightbox and **doesn't** toggle the candidate's checkbox.
     Neither does opening or closing the params section, or anything inside the lightbox.
   - A card's selection and comment survive opening and closing the lightbox, and the 2s poll.

### Out of scope

- Stepping between candidates inside the lightbox (prev/next). You close it and pick the next one.
- Merging the gate's inline card into `CandidateCard`. Both keep their own layout and share the
  new pieces.
- Formatting `captured_at` as local time.
- Showing a viewport or device picker, or any screenshot beyond `screenshot.png`.
- Any Rust or API change.

## Tech Stack

Svelte 5 (runes), TypeScript, Vite, Tailwind 4, and shadcn-svelte on bits-ui. The lightbox uses
the existing `dialog` component under `src/lib/components/ui/`, as `RunDialog.svelte` does. No
new dependencies.

## Commands

Run from `frontend/`. The Vitest suite needs a real server on `127.0.0.1:21541` built from this
branch (see the backlog's "Frontend test gotcha").

```bash
# Terminal 1, repo root: a server that needs no API keys and spends nothing
SMASHER_PROVIDER=claude-cli SMASHER_CLAUDE_CLI=<path to a fake claude script> \
  cargo run -p smasher-cli -- serve

# Terminal 2, frontend/
npm test -- --run                                   # Vitest, whole suite
npm test -- --run tests/lib/previewScale.test.ts
npm test -- --run tests/components/dashboard/CandidatePreview.test.ts
npm test -- --run tests/components/dashboard/CandidateGallery.test.ts tests/components/dashboard/GalleryGate.test.ts
npm run check                                       # svelte-check --threshold error
npm run lint
npm run test:e2e -- e2e/candidate-preview.spec.ts e2e/gallery-gate.spec.ts
npm run build
```

## Project Structure

```
frontend/vite.config.ts                                       → proxy /candidate-artifacts to the server (dev + Playwright)
frontend/src/lib/previewScale.ts                              → NEW: pure fit-to-box scale + viewport-from-manifest helpers
frontend/src/components/dashboard/CandidatePreview.svelte     → NEW: thumbnail button + placeholder + lightbox (+ ⟲, new-tab link)
frontend/src/components/dashboard/CandidateParams.svelte      → NEW: the collapsed `params` <details>
frontend/src/components/dashboard/CandidateCard.svelte        → use both; captured_at on the failed card
frontend/src/components/dashboard/GalleryGate.svelte          → use both; stop thumbnail/params clicks toggling the checkbox
frontend/tests/lib/previewScale.test.ts                       → NEW
frontend/tests/components/dashboard/CandidatePreview.test.ts  → NEW
frontend/tests/components/dashboard/CandidateGallery.test.ts  → replace the "only one <img>" check; params, captured-at
frontend/tests/components/dashboard/GalleryGate.test.ts       → thumbnail doesn't toggle selection; params
frontend/e2e/candidate-preview.spec.ts                        → NEW
```

`CandidatePreview` takes the `CandidateResponse` and nothing else, so both cards mount it as it
is.

## Code Style

Match `lib/runRequest.ts` and `RunDialog.svelte`: two `ABOUTME:` lines, small exported pure
functions, and short comments that explain why. The scale helper is intended to look like this:

```ts
// ABOUTME: Sizing for the candidate lightbox: the capture viewport, scaled down to fit the window
// ABOUTME: Pure functions so the fit maths is unit-tested without a DOM

export interface Viewport {
  width: number;
  height: number;
}

// render-capture shoots 1280×800; older or hand-written manifests may lack a viewport.
export const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 };

export function viewportOf(manifest: Record<string, unknown> | undefined): Viewport {
  const v = manifest?.viewport as Partial<Viewport> | undefined;
  if (typeof v?.width === 'number' && v.width > 0 && typeof v.height === 'number' && v.height > 0) {
    return { width: v.width, height: v.height };
  }
  return DEFAULT_VIEWPORT;
}

// Never above 1: a small design is shown at its real size, not blown up.
export function fitScale(viewport: Viewport, box: Viewport): number {
  return Math.min(1, box.width / viewport.width, box.height / viewport.height);
}
```

Conventions:

- camelCase names.
- `data-testid` only where there's no role or label to find the element by.
- ⟲ reloads by re-creating the iframe (`{#key resetCount}`), which does what the old
  "remove `src`, set it again" did without touching the DOM by hand.
- The thumbnail button's click handler calls `preventDefault()` and `stopPropagation()`, as the
  old ⟲ script did, so the gate's surrounding `<label>` doesn't toggle.

## Testing Strategy

Everything uses real HTTP against the real server, with no mocks, as the rest of the suite does.
Candidates are seeded by writing `manifest.json`, a small real PNG as `screenshot.png`, and, where
needed, a `bundle/index.html` straight into the server's artifacts dir. The existing gallery tests
do the same, because render-capture needs a headless Chromium. Runs come from gate-only DOT, so no
test spends tokens.

- **Unit (Vitest), `previewScale.test.ts`.** Pure functions, no DOM:
  - `viewportOf` reads a valid viewport, and falls back to 1280×800 for a missing, partial, zero or
    non-numeric one;
  - `fitScale` returns 1 when the box is bigger, and uses whichever of width or height is tighter
    when it's smaller.
- **Component + integration (Vitest + real server), `CandidatePreview.test.ts`:**
  - it renders an `<img>` of `screenshot_url` inside a button named `Open preview of {id}`, and no
    iframe;
  - clicking the button opens a dialog titled with the id. With a bundle, the dialog holds an
    iframe with `sandbox="allow-scripts"` and `src` = `bundle_url`, sized to the manifest
    viewport. It also has ⟲ and an **Open in new tab** link to `bundle_url`;
  - ⟲ replaces the iframe element with a new one with the same `src`;
  - without a bundle, the dialog shows the full-size screenshot, has no iframe and no ⟲, and the
    link points at `screenshot_url`;
  - Escape closes it.
  - jsdom doesn't load images, so the `No screenshot` placeholder is covered in Playwright.
- **Integration, `CandidateGallery.test.ts`.** The "only one `<img>`" check is replaced: every
  live candidate now has a thumbnail and no card has an iframe. New checks: the params section
  lists `generation_params` and is absent when it's empty, and the failed card shows its
  `captured_at`.
- **Integration, `GalleryGate.test.ts`.** Clicking a thumbnail opens the lightbox and leaves the
  checkbox unchecked. Toggling params leaves it unchecked too. The gate's failed card has no
  `captured_at`. The existing decision tests still pass.
- **End-to-end (Playwright), `candidate-preview.spec.ts`.** A gate-only run, with three candidates
  seeded:
  - a PNG plus a bundle whose page has a counter button;
  - a PNG with no bundle;
  - no PNG and no bundle.
  Checks:
  - the thumbnails load;
  - the third shows `No screenshot`;
  - opening the first shows the iframe scaled to fit a 1024×768 window;
  - clicking the bundle's counter inside the iframe changes it, and ⟲ puts it back to 0;
  - **Open in new tab** opens the bundle;
  - the checkbox stays unchecked through all of it.
  The existing `gallery-gate.spec.ts` still passes unchanged.
- **Gates:**
  - `npm run check` and `npm run lint` add no new errors. The 6 existing `svelte-check` errors are
    #2's.
  - The full Vitest suite passes with no new warnings.
  - `make ci` stays green. Nothing outside `frontend/` changes.

## Boundaries

- **Always:**
  - Write the failing test first.
  - Keep two `ABOUTME:` lines per file.
  - Run the Vitest suite against a server built from this branch.
  - Commit after each task.
  - Seed candidates on disk rather than running render-capture.
- **Ask first:**
  - Any Rust or API change, including adding fields to `CandidateResponse`.
  - A new npm dependency.
  - Merging the gate's card into `CandidateCard`, or any other restructuring beyond the files
    listed above.
  - Adding `allow-same-origin` or any other permission to the iframe sandbox.
- **Never:**
  - Mock `fetch` or the server in these tests.
  - Reach into the iframe's `contentWindow` from app code.
  - Launch a run from a workflow with box nodes in any test.
  - Set `SMASHER_LLM_TESTS=1`.
  - Touch the 6 pre-existing `svelte-check` errors.

## Success Criteria

- [ ] Live cards in the gallery and at the gate show a screenshot thumbnail and no iframe. A
      missing screenshot shows `No screenshot`.
- [ ] Clicking a thumbnail opens a lightbox with the live bundle at its capture viewport, scaled
      to fit and clickable. Without a bundle, it shows the full screenshot.
- [ ] ⟲ resets the bundle to its start state.
- [ ] **Open in new tab** opens the bundle, or the screenshot when there's no bundle.
- [ ] A non-empty `generation_params` shows as a collapsed `params` section on both cards.
- [ ] Failed cards in the gallery show `captured_at`, and the gate's don't.
- [ ] At the gate, the thumbnail, params and lightbox never toggle the checkbox, and selections and
      comments survive the lightbox and the poll.
- [ ] New unit, integration and Playwright tests pass. The full Vitest suite passes, and `check`,
      `lint` and `make ci` add no new errors or warnings.

## Decisions (resolved 2026-09-25)

1. **The lightbox renders at the capture viewport** (manifest `viewport`, default 1280×800),
   scaled down to fit. It doesn't fill the window and reflow.
2. **A missing screenshot shows a placeholder tile**, not a fallback live iframe.
3. **No prev/next in the lightbox.**
4. **The lightbox has an Open in new tab link**, bringing back the old gate's link-out.

## Open Questions

None.

Spec approved by Jobsworth 2026-09-25.
