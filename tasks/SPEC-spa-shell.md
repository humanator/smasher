# Spec: spa-shell

Module 1 of [`capability-map-spa-repairs.md`](capability-map-spa-repairs.md). Restores three
app-wide behaviours the HTMX → SPA port dropped (`BACKLOG.md` #21: "Silent errors", "Page title
and favicon"), and provides the error toast the later modules use.

## Objective

Someone running a pipeline in the web or desktop app should never have an action fail without
being told why, and should be able to tell tabs and windows apart.

What the old UI did (`git show 0e5647c^:crates/smasher-web/templates/base.html`):

- **Error toast.** Any failed request showed the server's JSON `error` message, or
  `Request failed (<status>)` if there wasn't one, in a toast that closed after 6s or on click.
- **Titles.** `SMASHER — Workflows`, `SMASHER — Run`, `SMASHER — <workflow name>`,
  `SMASHER — Edit Workflow`, `SMASHER — New Workflow`.
- **Favicon.** An inline SVG ⚡.

What the SPA does today:

- **No toast outside the editor.** The sonner `<Toaster />` is mounted in `App.svelte`, but only
  `WorkflowEditorPage` uses it. Three failures show nothing at all:
  - answering a question (`QuestionCard.svelte:40`, `console.error` only);
  - polling questions (`QuestionCard.svelte:26`, `console.error` only);
  - polling the gallery gate (`GalleryGate.svelte:41`, empty `catch`).
- **Errors lose the server's message.** `handleResponse` in `runs.ts`, `questions.ts` and
  `gallery.ts` (and the one in `workflows.ts`) throw `HTTP <status>` without reading the body.
  Only `gallery.ts`'s `handleResponse` and `workflows.ts`'s `errorFromResponse` read it. So even
  the errors shown inline today say `HTTP 404` instead of `not found: run xyz`.
- **The title is always `smasher-spa`**, and the favicon points at `/vite.svg`, which doesn't
  exist (`frontend/public/` is empty), so there's no icon.

### User stories and acceptance criteria

1. **When I answer a question and the server rejects it, I see why.**
   - A failed `answerQuestion` shows an error toast with the server's message
     (e.g. `not found: …`).
   - The question stays on screen so I can try again. It isn't removed from the store.
2. **When polling keeps failing, I'm told once, not every 2 seconds.**
   - The question poll and the gallery-gate poll each show one error toast when they start
     failing.
   - While they keep failing, no more toasts appear, even if I close the first one.
   - Once a poll succeeds, the next failure toasts again.
   - The two polls use separate toasts, so one failing doesn't hide the other.
3. **Every API error carries the server's message.**
   - `runs.ts`, `questions.ts`, `gallery.ts` and `workflows.ts` all build errors with one shared
     `errorFromResponse`.
   - The error's `message` is the body's `error` string when there is one, and `HTTP <status>`
     otherwise. Its `status` is the HTTP status.
   - Inline errors that already exist (catalog, run list, token counter, gallery, decision
     history) now show the server's message, with no change to those components.
4. **Each page has its own title.** `document.title` follows the page:
   - Catalog (`/`): `Smasher`
   - Run (`/runs/{id}`): `Run {id} — Smasher`
   - Edit (`/workflows/{id}/edit`): `Edit Workflow — Smasher`
   - New (`/workflows/new`): `New Workflow — Smasher`

   It updates on back/forward navigation. `workflow-detail` adds
   `{workflow name} — Smasher` later.
5. **The tab shows a ⚡ icon.** `index.html` uses the old inline-SVG ⚡ data URI and no longer
   references `/vite.svg`.

### Out of scope

- Changing the inline errors that already work. They stay inline and don't also toast.
- Errors inside `EventSource` streams (`events.ts`). `event-log` owns those.
- The run-graph error at `RunDetail.svelte:43`. `run-summary` shows it inline, next to the graph.
- The desktop window title. Tauri sets it to `Smasher` in `smasher-desktop/src/main.rs` and
  doesn't follow `document.title`. Leave it.

## Tech Stack

Svelte 5 (runes), TypeScript, Vite, Tailwind 4, shadcn-svelte on bits-ui, `svelte-sonner`
(already a dependency and mounted in `App.svelte`). No new dependencies.

## Commands

Run from `frontend/`. The Vitest suite needs a real server on `127.0.0.1:21541` built from this
branch (see the backlog's "Frontend test gotcha").

```bash
# Terminal 1, repo root: a server that needs no API keys and spends nothing
SMASHER_PROVIDER=claude-cli SMASHER_CLAUDE_CLI=<path to a fake claude script> \
  cargo run -p smasher-cli -- serve

# Terminal 2, frontend/
npm test -- --run                         # Vitest, whole suite
npm test -- --run tests/lib/notify.test.ts
npm run check                             # svelte-check --threshold error
npm run lint
npm run test:e2e -- e2e/critical-path.spec.ts
npm run build
```

## Project Structure

```
frontend/index.html                        → favicon + default <title>
frontend/src/App.svelte                    → sets document.title from the route
frontend/src/lib/api/errors.ts             → NEW: ApiError + errorFromResponse, shared by all API modules
frontend/src/lib/api/{runs,questions,gallery,workflows}.ts → use errors.ts, drop their local copies
frontend/src/lib/notify.ts                 → NEW: notifyError + pollFailureNotifier (wrap svelte-sonner)
frontend/src/components/dashboard/QuestionCard.svelte  → toasts on answer and poll failure
frontend/src/components/dashboard/GalleryGate.svelte   → toasts on poll failure
frontend/tests/lib/api/errors.test.ts      → NEW
frontend/tests/lib/notify.test.ts          → NEW
frontend/tests/components/…                → extend QuestionCard, GalleryGate, AppLayout tests
frontend/e2e/critical-path.spec.ts         → extend: title + favicon
```

## Code Style

Match the existing `lib/api` modules: two `ABOUTME:` lines, small exported functions, short
comments that explain why. The helpers are intended to look like this:

```ts
// ABOUTME: App-wide error toasts, built on svelte-sonner's <Toaster /> in App.svelte
// ABOUTME: notifyError for one-off failures; pollFailureNotifier toasts once per run of failures

import { toast } from 'svelte-sonner';

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function notifyError(err: unknown, fallback: string, id?: string): void {
  toast.error(errorMessage(err, fallback), { id });
}

// A poller calls fail() on every failed tick and ok() on every good one. Only the first
// failure after a success shows a toast, so a dead server doesn't re-toast every 2s.
export function pollFailureNotifier(id: string, fallback: string) {
  let failing = false;
  return {
    fail(err: unknown) {
      if (!failing) notifyError(err, fallback, id);
      failing = true;
    },
    ok() {
      failing = false;
    },
  };
}
```

Conventions: camelCase function names, `err instanceof Error ? … : fallback` for
messages as elsewhere, and no `console.error` left at sites that now toast.

## Testing Strategy

Everything uses real HTTP against the real server, with no mocks, as the rest of the suite does.

- **Unit (Vitest), `errors.test.ts`.** Build real `Response` objects:
  - a JSON `{"error": "..."}` body gives that message and the status;
  - a JSON body without `error` gives `HTTP 500`;
  - a non-JSON or empty body gives `HTTP <status>`.
- **Unit (Vitest), `notify.test.ts`.** Render `<Toaster />` and assert on the DOM:
  - `notifyError` shows the message, or the fallback for a non-Error;
  - `pollFailureNotifier` gives one toast for three `fail()` calls, and another after `ok()`
    then `fail()`;
  - two notifiers with different ids give two toasts.
- **Integration (Vitest + real server):**
  - Each API module rejects with the server's message on a real 404 (e.g. `getRun('no-such-run')`
    gives `not found: run no-such-run`, as `WebError::NotFound` renders it).
  - `QuestionCard`: answering a question id that doesn't exist on a real run shows a toast with
    the server's message, and the question stays.
  - `GalleryGate` and `QuestionCard` polls for a nonexistent run show one toast after several
    ticks.
  - `AppLayout`: `document.title` for each route, and after a `popstate`.
- **End-to-end (Playwright), `critical-path.spec.ts`.** Assert `page.title()` on the catalog and a
  run page, and that the favicon `<link>` is the ⚡ data URI.
- **Gates:**
  - `npm run check` and `npm run lint` add no new errors. The 6 existing `svelte-check` errors
    are #2's, not this module's.
  - The full Vitest suite passes with no new warnings.
  - `make ci` stays green. There are no Rust changes, but it checks nothing broke.

## Boundaries

- **Always:**
  - Write the failing test first.
  - Keep two `ABOUTME:` lines per file.
  - Run the Vitest suite against a server built from this branch.
  - Commit after each task.
  - Read the old behaviour from `0e5647c^` before changing a component.
- **Ask first:**
  - Any Rust or API change.
  - A new npm dependency.
  - Replacing an existing inline error with a toast.
  - Changing the sonner `<Toaster />` placement or options.
- **Never:**
  - Mock `fetch` or the server in these tests.
  - Leave a failure that neither toasts nor shows inline.
  - Touch the 6 pre-existing `svelte-check` errors (#2 owns them).
  - Change the editor's existing toasts.

## Success Criteria

- [ ] A rejected answer shows a toast with the server's `error` text, and the question stays.
- [ ] A dead question or gallery-gate poll gives exactly one toast per run of failures, per poller.
- [ ] All four API modules share `errorFromResponse`, and no copy of `handleResponse` throws a
      bare `HTTP <status>` when the body has an `error`.
- [ ] `document.title` matches the table in story 4 on each route and after back/forward.
- [ ] The tab shows ⚡, and `/vite.svg` isn't requested.
- [ ] New unit, integration and Playwright tests pass; the full Vitest suite passes; `check`,
      `lint` and `make ci` add no new errors or warnings.

## Open Questions

1. **Title format.** I've put the page first (`Run 01m… — Smasher`), so tabs stay readable when
   truncated. The old app put the brand first, in capitals: `SMASHER — Run`. Which do you want?
2. **Toast duration.** The old toast closed after 6s. Sonner's default is 4s. I'd keep sonner's
   default unless you want 6s.
