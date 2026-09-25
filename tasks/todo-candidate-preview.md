# Todo: candidate-preview

Plan: [`plan-candidate-preview.md`](plan-candidate-preview.md). Spec:
[`SPEC-candidate-preview.md`](SPEC-candidate-preview.md).

Before any Vitest or Playwright run: quit the desktop app, then from the repo root
`SMASHER_PROVIDER=claude-cli SMASHER_CLAUDE_CLI=<fake claude> cargo run -p smasher-cli -- serve`.
All commands below run from `frontend/`. Every run a test launches uses gate-only DOT. Never set
`SMASHER_LLM_TESTS=1`. Candidates are seeded on disk (`manifest.json`, a base64 PNG,
`bundle/index.html`), never through render-capture.

## Task 1: Proxy `/candidate-artifacts` in the Vite dev server (approved 2026-09-25)

**Description:** Add a `'/candidate-artifacts'` entry to `server.proxy` in `vite.config.ts`, with
the same target and `changeOrigin` as `/api`. Without it, the dev server, and so Playwright,
answers every screenshot and bundle URL with the SPA's `index.html`.

**Acceptance criteria:**
- [x] With the server and `npm run dev` running, a candidate file seeded on disk is served
      through `127.0.0.1:5173/candidate-artifacts/…` with its real content type (`image/png`), not
      `text/html`
- [x] `/api` and `/events` behave as before *(`/api` checked with `curl`; `/events` through
      the run page in `gallery-gate.spec.ts`)*

**Verification:**
- [x] Before the change, `curl -sI 127.0.0.1:5173/candidate-artifacts/<run>/artifacts/<cand>/screenshot.png`
      returns `text/html`. After it, `image/png`. *(Checked against the desktop app's data before
      the test server was up: a missing path went from `200 text/html` to a `404` from the server,
      and a real screenshot came back `image/png`.)*
- [x] `npm run build` succeeds. `npm run test:e2e -- e2e/gallery-gate.spec.ts` still passes.

**Dependencies:** None

**Files:** `frontend/vite.config.ts`

**Scope:** XS

## Task 2: `lib/previewScale.ts`

**Description:** `Viewport`, `DEFAULT_VIEWPORT`, `viewportOf(manifest)` and
`fitScale(viewport, box)`, exactly as sketched in the spec's Code Style section. Pure, with no
Svelte or DOM imports.

**Acceptance criteria:**
- [x] `viewportOf` returns a valid `{width, height}` as given, and 1280×800 for a missing
      manifest, a missing viewport, a partial one, a zero or negative side, and non-numeric values
- [x] `fitScale` returns 1 when the box is larger in both directions (never scales up), and the
      tighter of `box.width / w` and `box.height / h` when either is smaller

**Verification:**
- [x] `npm test -- --run tests/lib/previewScale.test.ts`, written first and seen failing

**Dependencies:** None

**Files:** `frontend/src/lib/previewScale.ts`, `frontend/tests/lib/previewScale.test.ts`

**Scope:** XS

## Checkpoint A: after Tasks 1–2
- [x] `npm test -- --run` passes in full, `npm run check` shows only the 6 pre-existing errors,
      and `npm run lint` is clean
- [x] One commit per task

## Task 3: `CandidatePreview`: thumbnail button, placeholder and lightbox

**Description:** A new `CandidatePreview.svelte` with prop `candidate: CandidateResponse`. It
renders a `<button aria-label="Open preview of {id}">` holding an
`<img src={screenshot_url} alt="Candidate {id}">` (top-aligned, `object-cover`) in a box with the
manifest viewport's aspect ratio (`viewportOf`). An `onerror` swaps the image for a muted
`No screenshot` tile. The click handler calls `preventDefault()` and `stopPropagation()`, then
opens a shadcn `Dialog` titled with the id. The dialog has a stage that measures itself
(`bind:clientWidth`/`clientHeight`). With a bundle, it holds
`<iframe sandbox="allow-scripts" title="Candidate {id}" src={bundle_url}>` at viewport width ×
height px. Without one, it holds the full-size screenshot at the same size, with its own
`No screenshot` fallback. Both are scaled by `fitScale` from the top left, with no transform while
the stage measures 0.

**Acceptance criteria:**
- [x] The component renders the button and `<img>` and no `<iframe>`. The aspect ratio follows
      the manifest viewport, with 16:10 when it's missing. *(smasher-web requires `viewport`, so
      the API never returns a manifest without one; the fallback is covered by `previewScale.test.ts`.)*
- [x] Clicking the button opens a dialog titled with the id. With a bundle, the dialog has the
      sandboxed iframe with `src` = `bundle_url` and a style width/height of the viewport. Without
      one, it has the full-size `<img>` and no iframe.
- [x] Escape and the close button both close it. Overlay click is covered in Task 7.

**Verification:**
- [x] `npm test -- --run tests/components/dashboard/CandidatePreview.test.ts`, written first and
      seen failing. It uses a real run (gate-only DOT) and candidates read back through
      `runsApi.listCandidates`, so the props are real API responses. It follows
      `RunDialog.test.ts`'s dialog setup.
- [x] `npm run check` adds no errors

**Dependencies:** Task 2

**Files:** `frontend/src/components/dashboard/CandidatePreview.svelte`,
`frontend/tests/components/dashboard/CandidatePreview.test.ts`

**Scope:** S

## Task 4: ⟲ reset and **Open in new tab**

**Description:** In the lightbox, add a `⟲` button (`aria-label="Reset preview to start"`), shown
only with a bundle, that increments `resetCount`. Wrap the iframe in `{#key resetCount}`. Add an
**Open in new tab** link (`target="_blank" rel="noopener"`) to `bundle_url`, or to
`screenshot_url` when there's no bundle. Nothing touches `contentWindow`.

**Acceptance criteria:**
- [x] Clicking ⟲ replaces the iframe with a new element (`!==` the old node) that has the same
      `src`
- [x] With no bundle, there's no ⟲ and the link points at `screenshot_url`. With one, it points
      at `bundle_url`. Both have `target="_blank"` and `rel="noopener"`.
- [x] `grep contentWindow src/` finds nothing

**Verification:**
- [x] New cases in `CandidatePreview.test.ts`, written first and seen failing, then passing

**Dependencies:** Task 3

**Files:** `frontend/src/components/dashboard/CandidatePreview.svelte`,
`frontend/tests/components/dashboard/CandidatePreview.test.ts`

**Scope:** XS

## Checkpoint B: after Tasks 3–4
- [x] Full Vitest suite green, `check`/`lint` add no new errors
- [x] One commit per task
- [ ] Optional, on request: Jobsworth looks at the lightbox in `npm run dev` with a seeded
      candidate *(not requested)*

## Task 5: Gallery card: preview, params and captured-at on failed cards

**Description:** Add `CandidateParams.svelte`: given `params: Record<string, string> | undefined`,
it renders nothing when that's empty or missing. Otherwise it renders a collapsed
`<details><summary>params</summary>` with one `{key}: {value}` row per entry, in the order given.
In `CandidateCard.svelte`, replace the `candidate-embed` block with `<CandidatePreview>`, and add
`<CandidateParams params={manifest.generation_params}>` to the live card. Add the
`captured_at` line to the failed card between the id and the reason. Update the ABOUTME if it no
longer says "live-embed".

**Acceptance criteria:**
- [x] In the gallery, every live candidate has an `Open preview of {id}` button with an `<img>`,
      and no card renders an `<iframe>`. This replaces the "only one `<img>`" check.
- [x] A candidate with `generation_params: { seed: '7', temperature: '0.4' }` shows a collapsed
      `params` section with `seed: 7` then `temperature: 0.4`. One with `{}` has no `params` text.
- [x] The failed card shows id, then `captured_at` (the raw string), then the reason

**Verification:**
- [x] `npm test -- --run tests/components/dashboard/CandidateGallery.test.ts`, with the new
      assertions written first and seen failing. `writeManifest` gains a `generationParams`
      argument.

**Dependencies:** Task 4

**Files:** `frontend/src/components/dashboard/CandidateParams.svelte`,
`frontend/src/components/dashboard/CandidateCard.svelte`,
`frontend/tests/components/dashboard/CandidateGallery.test.ts`

**Scope:** S

## Task 6: Gate card: preview and params without toggling the checkbox

**Description:** In `GalleryGate.svelte`'s live `<label>` card, replace the `candidate-embed`
block with `<CandidatePreview>`, and add `<CandidateParams>` after the id. The checkbox,
scorecard badges and comment box stay where they are. The failed card is unchanged (no
`captured_at`). The tests come first. If jsdom shows the label forwarding a thumbnail or
`<summary>` click to the checkbox, stop and ask before moving the preview or params out of the
`<label>` (see the plan).

**Acceptance criteria:**
- [x] Clicking a candidate's thumbnail opens the lightbox, and that candidate's checkbox is still
      unchecked. So is it after closing the lightbox.
- [x] Opening and closing the `params` section leaves the checkbox unchecked
- [x] A checked box and a typed comment are still there after opening and closing the lightbox
      and after the next 2s poll. The gate's failed card has no `captured_at`.
- [x] The existing gate tests (decision submit, comment cap, poll toasts) pass unchanged *(their
      bodies are unchanged; the seeding helper gained optional arguments and runs are cancelled
      in `afterEach`)*

**Verification:**
- [x] `npm test -- --run tests/components/dashboard/GalleryGate.test.ts`, with the new cases
      written first and seen failing *(3 of 4; the failed-card case passed from the start, as it
      guards existing behaviour. The params case uses `fireEvent`, because user-event's own
      `<label>` handling stops `<summary>` toggling; the e2e clicks it in Chromium.)*

**Dependencies:** Task 5 (`CandidateParams`)

**Files:** `frontend/src/components/dashboard/GalleryGate.svelte`,
`frontend/tests/components/dashboard/GalleryGate.test.ts`

**Scope:** S

## Checkpoint C: after Tasks 5–6
- [x] Full Vitest suite green with no new warnings, `check`/`lint` add no new errors
- [x] `npm run test:e2e -- e2e/gallery-gate.spec.ts` passes unchanged
- [x] One commit per task

## Task 7: `e2e/candidate-preview.spec.ts`, and mark the module done

**Description:** A Playwright test on a gate-only gallery-gate run (the same DOT shape as
`gallery-gate.spec.ts`, `candidate_count=3`) with three seeded candidates: `cand-a` with a PNG
and a bundle whose page has a `Count: 0` button that increments, `cand-b` with a PNG and no bundle,
and `cand-c` with neither. The window is 1024×768. The run is cancelled, and its artifacts dir is
removed, in `finally`. Then mark the module done in the capability map and the backlog.

**Acceptance criteria:**
- [x] The `cand-a` and `cand-b` thumbnails load (`naturalWidth > 0`), and `cand-c` shows
      `No screenshot`
- [x] Opening `cand-a` shows the iframe with a bounding box that is non-zero and inside the
      1024×768 window. After resizing the window to 800×600, the box shrinks.
- [x] Clicking `Count: 0` inside the iframe (`frameLocator`) makes it `Count: 1`. Waiting over
      2s (one gate poll) keeps it at `Count: 1`. ⟲ puts it back to `Count: 0`.
- [x] **Open in new tab** opens a page at the bundle URL showing `Count: 0`. Clicking the overlay
      closes the lightbox. `cand-b`'s lightbox shows its screenshot and no ⟲.
- [x] Every candidate checkbox is still unchecked at the end
- [x] `capability-map-spa-repairs.md` lists `candidate-preview` as `Done <date>`, and BACKLOG
      #9 and the card items of #21 (⟲, params, captured-at on failed cards) are marked done

**Verification:**
- [x] `npm run test:e2e -- e2e/candidate-preview.spec.ts e2e/gallery-gate.spec.ts` passes
- [x] Full Vitest suite, `npm run check`, `npm run lint` and `npm run build` pass, then
      `make ci` from the repo root

**Dependencies:** Tasks 1, 6

**Files:** `frontend/e2e/candidate-preview.spec.ts`, `tasks/capability-map-spa-repairs.md`,
`tasks/BACKLOG.md`, `tasks/plan-candidate-preview.md`

**Scope:** M

## Checkpoint D: Complete
- [x] Every Success Criteria box in the spec is ticked
- [x] `make ci` green. The diff outside `frontend/` is only in `tasks/`.
- [x] Review with Jobsworth (approved 2026-09-25)
