# Implementation Plan: spa-shell

Spec: [`SPEC-spa-shell.md`](SPEC-spa-shell.md) (approved 2026-09-25). Module 1 of
[`capability-map-spa-repairs.md`](capability-map-spa-repairs.md). Branch `feat/spa-port-repairs`.
Tasks and checkpoints: [`todo-spa-shell.md`](todo-spa-shell.md).

## Overview

Every API error carries the server's message. Failures that show nothing today (answering a
question, the question poll, the gallery-gate poll) get a sonner toast, and a failing poll toasts
once, not on every tick. Each route sets `document.title` (page name first), and the tab gets the
old ⚡ favicon. Frontend only.

## Dependency graph

```
lib/api/errors.ts (errorFromResponse)
    └── runs / questions / gallery / workflows use it     ← server messages everywhere
            └── lib/notify.ts (notifyError, pollFailureNotifier)
                    ├── QuestionCard: answer + poll toasts
                    └── GalleryGate: poll toast
App.svelte document.title    (independent)
index.html favicon           (independent)
```

## Architecture decisions

- **One `errorFromResponse` in `lib/api/errors.ts`**, lifted from `workflows.ts`, which already
  has the right behaviour: the body's `error` string, or `HTTP <status>`, plus `.status`. Each
  module keeps its own `handleResponse` for success handling, because they differ: `runs.ts`
  returns text for SVG, and `gallery.ts`/`questions.ts` require JSON. Only the error branch
  changes. This is the smallest change, and it doesn't rewrite any module.
- **`ApiError` moves to `errors.ts`** and is re-exported. The four local copies are deleted.
- **`notify.ts` wraps `svelte-sonner`'s `toast.error`** so components never build messages
  themselves. `pollFailureNotifier(id, fallback)` tracks a per-poller `failing` flag. The flag,
  not sonner's `id`, is what stops a dismissed toast reappearing on the next tick. The `id` just
  keeps one toast per poller on screen.
- **Toast ids:** `questions-poll:{runId}` and `gallery-gate-poll:{runId}`. Answer failures use no
  id, since each one is a separate user action.
- **Title:** a `$effect` in `App.svelte` derives `document.title` from the route state it already
  holds. The catalog is `Smasher`, and other routes are `{page} — Smasher`. The header's
  `pageTitle` stays as it is (the catalog header still reads "Smasher Pipelines"). The title gets
  its own small derived value so the header text doesn't change.
- **Favicon:** the old inline data URI is copied as-is into `index.html`. No file goes in
  `public/`.
- **E2E goes in a new `e2e/app-shell.spec.ts`**, not in `critical-path.spec.ts` as the spec
  suggested. The critical-path test runs real Codergen nodes for up to 10 minutes. Title, favicon
  and poll-toast checks need no run, and shouldn't wait on one or spend tokens. (This is a
  deviation from the spec's Project Structure; the spec is updated to match.)

## Task list

See `todo-spa-shell.md` for acceptance criteria and verification.

### Phase 1: Errors carry the server's message
- [x] Task 1: Shared `errorFromResponse` in `lib/api/errors.ts`
- [x] Task 2: All four API modules throw it

### Checkpoint A
- [x] Vitest suite and `npm run check` pass (no new errors), inline errors show server text

### Phase 2: Toasts
- [x] Task 3: `lib/notify.ts`
- [ ] Task 4: QuestionCard toasts on answer and poll failure
- [ ] Task 5: GalleryGate toasts on poll failure

### Checkpoint B
- [ ] Full suite green; manual check: a rejected answer and a dead poll each toast once

### Phase 3: Title and icon
- [ ] Task 6: `document.title` per route
- [ ] Task 7: ⚡ favicon and the `app-shell` Playwright spec

### Checkpoint C: Complete
- [ ] All spec success criteria met, `make ci` green, review with Jobsworth

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing tests assert on `HTTP <status>` text that becomes the server's message | Low | A grep found none outside a loose comment in `WorkflowEditorPage.test.ts:71`. Task 2 runs the full suite. |
| sonner doesn't render in jsdom | Low | `tests/setup.ts` already stubs `matchMedia`, and `WorkflowEditorPage.test.ts` already asserts on real toasts |
| Poll tests are slow (2s interval × several ticks) | Med | Tests use `waitFor` with bounded timeouts, and target a nonexistent run id so each tick fails right away. The test waits past 3 ticks and asserts a single toast. |
| Toasts from one test leak into the next (the Toaster is module-global state) | Med | Call `toast.dismiss()` in `afterEach` in each new test file |
| The Vitest server isn't on this branch, or the desktop app holds 21541 | Med | Follow the backlog's "Frontend test gotcha": quit the app, serve from this branch with the fake-claude env |

## Open questions

None. The title format and toast duration were settled in the spec.
