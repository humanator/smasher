# Implementation Plan: candidate-preview

Spec: [`SPEC-candidate-preview.md`](SPEC-candidate-preview.md) (approved 2026-09-25). Module of
[`capability-map-spa-repairs.md`](capability-map-spa-repairs.md). Branch `feat/spa-port-repairs`.
Tasks and checkpoints: [`todo-candidate-preview.md`](todo-candidate-preview.md).

## Overview

Candidate cards in the run gallery and at the gallery gate stop embedding a live 4:3 iframe.
Each shows a screenshot thumbnail button instead. The button opens a lightbox with the live
bundle at its capture viewport, scaled down to fit, with ⟲ and **Open in new tab**. Both cards
also get a collapsed `params` section, and the gallery's failed card shows `captured_at`. Two new
components (`CandidatePreview`, `CandidateParams`) and one pure helper (`previewScale.ts`) are
shared by both cards. Frontend only.

## Dependency graph

```
vite.config.ts proxy for /candidate-artifacts ─────────────┐  (dev + Playwright can load PNGs/bundles)
lib/previewScale.ts (viewportOf, fitScale) ──┐             │
                                             └── CandidatePreview.svelte
                                                  (thumbnail, placeholder, lightbox, ⟲, new-tab link)
CandidateParams.svelte ──────────────────────────────┐     │
                                                     ├─────┴── CandidateCard.svelte  (gallery)
                                                     └──────── GalleryGate.svelte    (gate)
                                                                    └── e2e/candidate-preview.spec.ts
```

`previewScale`, `CandidateParams` and the proxy don't depend on each other. The two card
integrations only share the new components, so they could run in parallel, but they're small
enough to do in order.

## Architecture decisions

- **`CandidatePreview` takes only `candidate: CandidateResponse`** and owns everything
  preview-related: the thumbnail button, the image-failed flag, the lightbox's `open` state and
  the ⟲ `resetCount`. Both cards mount it as it is (spec). `GalleryGate`'s candidates are already
  typed `CandidateResponse` (`lib/api/questions.ts:18`), so no adapter is needed.
- **The lightbox is the shadcn `Dialog`** (`$lib/components/ui/dialog`), as in `RunDialog`. Its
  built-in close button (`sr-only` "Close"), Escape and overlay click give story 3's three ways
  to close for free. `Dialog.Content` gets a class override for a near-full-window size
  (`sm:max-w-[calc(100vw-2rem)]`, a fixed height), replacing its default `sm:max-w-md`.
- **Fitting.** A stage `<div>` inside the dialog measures itself with `bind:clientWidth` and
  `bind:clientHeight`. That makes it rescale on window resize with no manual listener. The
  iframe, or the full-size `<img>`, is laid out at `viewport.width × viewport.height` px with
  `transform: scale(s)` and `transform-origin: top left`, inside a wrapper sized
  `viewport × s`, so the scaled content takes up no phantom space. `s = fitScale(viewport, box)`.
- **Before the stage is measured (width or height 0), no transform is applied.** jsdom always
  reports 0, and a real browser does for the first frame. `fitScale` with a 0 box would return
  0 and hide the content. The guard lives in the component, so `fitScale` stays exactly as the
  spec sketches it.
- **⟲ is `{#key resetCount}` around the iframe** (spec). It's only rendered with a bundle.
- **The image fallback is an `onerror` flag, `imageFailed`,** that swaps the `<img>` for a muted
  `No screenshot` tile. The thumbnail and the lightbox's full-size image each have their own
  flag, because the lightbox mounts a new `<img>`. It isn't reset on poll: `screenshot_url` never
  changes for a candidate.
- **The thumbnail button's `onclick` calls `preventDefault()` and `stopPropagation()`, then
  opens the dialog** (spec).
- **Why clicks inside the gate's `<label>` shouldn't toggle the checkbox.** Under the DOM spec, a
  click activates only the innermost element on its path that has activation behaviour. For the
  thumbnail that's the `<button>`, and for params it's the `<summary>`, so the `<label>`'s own
  activation (forwarding the click to the checkbox) doesn't run. `stopPropagation()` doesn't
  change which element activates. It only keeps the click from reaching the card's other
  handlers. `preventDefault()` must **not** go on `<summary>`, because it would stop the
  `<details>` opening. So `CandidateParams` is a plain `<details>` with no handlers. Whether
  jsdom's label follows the same rule is unverified. Task 6's tests are written first and settle
  it. If the checkbox does toggle, the fallback is to take the preview and params out of the
  `<label>`. That only moves them in the markup and keeps the card's layout, but it's a
  restructure of the gate card, so check with Jobsworth first.
- **The lightbox portals to `body`,** so clicks inside it never pass through the gate's `<label>`
  in the DOM. Nothing extra is needed there. The Task 6 test covers it anyway.
- **Lightbox state survives the polls.** Both `{#each}` blocks are keyed by `candidate_id`, so
  a poll swaps the `candidate` prop but keeps the `CandidatePreview` instance, its `open` flag and
  its iframe (`bundle_url` is unchanged, so `src` doesn't change and the iframe doesn't reload).
  The e2e covers this by waiting through a poll with the counter clicked.
- **Tests seed candidates the way the existing ones do**: a `writeManifest` helper per file, plus
  a small base64 PNG constant written as `screenshot.png`, and `bundle/index.html` where needed.
  No shared helper module: every existing test file keeps its own copy, and the spec lists no new
  helper file.

## Verified context (checked against the code 2026-09-25)

- **The Vite dev server doesn't proxy `/candidate-artifacts`.** `vite.config.ts` proxies only
  `/api` and `/events`. The server serves candidate files at `/candidate-artifacts/…`
  (`smasher-web/src/server.rs:62`, URLs built in `candidates.rs:73-88`). Under `npm run dev`, and
  so under Playwright (its `webServer` is `npm run dev` on 5173), every thumbnail and bundle URL
  falls through to the SPA's `index.html`. No test noticed, because `gallery-gate.spec.ts` writes
  no PNGs. **The spec's e2e can't pass without a third proxy entry.** That's a one-line change
  inside `frontend/`. Jobsworth approved it on 2026-09-25, and the spec's Project Structure now
  lists `vite.config.ts`. The production build and the desktop app are same-origin and unaffected.
- **`bundle_url` is set only when the manifest lists a `live_bundle` artifact**, as
  `/candidate-artifacts/{run}/artifacts/{cand}/{path}` (`candidates.rs:73-82`). So to seed a
  bundle, write `bundle/index.html` and list `{ kind: 'live_bundle', path: 'bundle/index.html' }`.
- **`screenshot_url` is always set**, whether or not the file exists (`candidates.rs:85`).
- **Candidates come back sorted by id** (`candidates.rs:95`), and `generation_params` is a
  `BTreeMap`, so its JSON keys are already sorted. Rendering `Object.entries` in order meets
  story 5 with no client-side sort.
- **The gate's live card is a native `<label>` wrapping a bits-ui `Checkbox`**
  (`GalleryGate.svelte:131-139`), and the gate polls every 2s. The gallery polls every 5s.
- **`Dialog.Content` has its own close button** (`dialog-content.svelte`, `showCloseButton`
  defaults to true), labelled `Close` via `sr-only`.
- **The current `CandidateGallery.test.ts`** asserts exactly one `<img>` (`:121-123`). Task 5
  replaces it. Its `writeManifest` writes `generation_params: {}`, so it needs a parameter for the
  params test.
- **Dialog tests in jsdom** follow `SettingsDialog.test.ts` / `RunDialog.test.ts`:
  `userEvent.setup()`, query `screen` (portal), reset `document.body.style.pointerEvents` in
  `afterEach`.
- **jsdom doesn't load images or iframes**, so `onerror` never fires and a size is never measured.
  The placeholder, the scaling and the in-iframe counter are covered in Playwright only (spec).

## Task list

See `todo-candidate-preview.md` for acceptance criteria and verification.

### Phase 1: Foundations
- [x] Task 1: Proxy `/candidate-artifacts` in the Vite dev server (approved 2026-09-25)
- [x] Task 2: `lib/previewScale.ts`

### Checkpoint A
- [ ] Full Vitest suite green, `check`/`lint` add no new errors

### Phase 2: The preview component
- [x] Task 3: `CandidatePreview`: thumbnail button, placeholder and lightbox
- [x] Task 4: ⟲ reset and **Open in new tab**

### Checkpoint B
- [ ] Full suite green. Jobsworth looks at the lightbox in `npm run dev` (optional, on request)

### Phase 3: Wire into both cards
- [ ] Task 5: Gallery card: preview, params and captured-at on failed cards
- [ ] Task 6: Gate card: preview and params without toggling the checkbox

### Checkpoint C
- [ ] Full suite green, the existing `gallery-gate.spec.ts` passes

### Phase 4: End to end
- [ ] Task 7: `e2e/candidate-preview.spec.ts`, and mark the module done

### Checkpoint D: Complete
- [ ] All spec success criteria met, `make ci` green
- [ ] Review with Jobsworth

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| A click on the thumbnail or on `<summary>` inside the gate's `<label>` still toggles the checkbox | High | Task 6's tests are written first and assert the checkbox stays unchecked, and Task 7 checks the same in a real browser. The fallback is taking both out of the `<label>`, after asking (see Architecture decisions). |
| Without the proxy, Playwright can't load a PNG or a bundle, and the e2e fails for reasons unrelated to the code | High | Task 1, before anything else. It's checked with a `curl` through 5173. |
| `fitScale` returns 0 before the stage is measured, so the lightbox shows nothing | Med | Guard in the component: no transform while the box is 0. Task 7 checks the rendered iframe is non-zero and fits the window. |
| bits-ui's dialog focus trap or pointer-events lock interferes with clicking inside the iframe | Med | Task 7 clicks the bundle's counter through `frameLocator`. That's the real proof, since jsdom can't show it. |
| Playwright can't reach into a sandboxed iframe with an opaque origin | Low | `frameLocator` drives frames over CDP regardless of origin. If it fails, check the counter from `page.frames()` instead. App code never touches `contentWindow` either way. |
| A test run reaches an LLM node | High | Every run uses gate-only DOT (`oval`/`hexagon` gallery gate). No box nodes. `SMASHER_LLM_TESTS` stays unset. |
| The Vitest server is from another branch, or the desktop app holds 21541 | Med | Follow the backlog's "Frontend test gotcha" before every suite run |
| Gate-parked test runs pile up on the dev server | Low | Cancel launched runs in `afterEach` with `runsApi.cancelRun`, as `run-launch` did |

## Open questions

None. (The `vite.config.ts` proxy was approved 2026-09-25.)
