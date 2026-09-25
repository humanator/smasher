# Capability Map: SPA port repairs

Source: `BACKLOG.md` #9 (candidate thumbnails and lightbox) and #21 (what the HTMX → SPA port
dropped). Old behaviour is read from the templates deleted in `0e5647c`
(`git show 0e5647c^:crates/smasher-web/templates/<file>`). Approved by Jobsworth 2026-09-25.

| Module id | Responsibility | Depends on | Status |
|---|---|---|---|
| `spa-shell` | Shared error toast for failed API requests (deduped, so a failing poll doesn't toast every tick), per-page `<title>`, ⚡ favicon | — | Planned |
| `candidate-preview` | #9: screenshot thumbnail → full-size, interactive lightbox of the live bundle with a ⟲ reset; params section (`generation_params`); captured-at on failed cards; in both `CandidateCard` and `GalleryGate`. Scorecard badges, checkbox and comment box stay on the card | `spa-shell` | Planned |
| `run-launch` | Run dialog (Model, Variables, Brief, Node Overrides) opened by the catalog's Run button, replacing the empty-request launch. Submit navigates to `/runs/{id}` | `spa-shell` | Planned |
| `run-summary` | `RunDetail` shows Completed, Working Directory and Error; pipeline graph re-fetches every 3s, surfaces its errors, scales to fit the width; token counter total and 3s poll; run list shows "unnamed" for a blank graph name | `spa-shell` | Planned |
| `question-card` | Question type and id on the card, Submit button for free text, radio buttons + Submit for multiple choice, no 2s wait before the first fetch, "No pending questions." empty state | `spa-shell` | Planned |
| `event-log` | Newest-first, colour-coded by type, agent events indented, noisy ones faded, follows new events; a readable line for all 17 event types | — | Planned |
| `workflow-detail` | New `/workflows/{id}` route: name, source dir, Edit button, Run button (opens the `run-launch` dialog), active-run summary card linking to `/runs/{id}`, and that workflow's run history (runs filtered by `workflow_id`). Catalog links to it | `run-launch`, `run-summary` | Planned |

Build order: `spa-shell` → `candidate-preview`, `run-launch`, `run-summary`, `question-card`,
`event-log` (independent, any order) → `workflow-detail`

## Decisions

- **Frontend only.** The API already provides everything: candidates carry `screenshot_url`,
  `bundle_url` and a `manifest` with `generation_params` and `captured_at`; `RunSummary` has
  `completed_at`, `run_working_dir`, `error` and `workflow_id`; `POST /api/workflows/{id}/run`
  accepts `model`, `variables` and `node_overrides`. Brief is sent as `variables.brief`, as the
  old form did. If a module turns out to need a backend change, stop and ask.
- **The run form is a dialog, not an inline form.** Its fields only matter before a run starts,
  so both the catalog and the workflow detail page open the same dialog, and submit goes to the
  new run's page.
- **Model is free text** for now, as in the old form. #20 replaces it with a picker.
- **Node Overrides is a raw JSON textarea**, validated before submit with an inline error.
- **The workflow detail page links to the active run** instead of embedding the run view.
- **No new npm dependencies.** The lightbox and run dialog use the existing bits-ui/shadcn dialog.
- Deliberate cuts stay cut: the raw-DOT paste form and the Telemetry drawer (see `BACKLOG.md` #21).

## Files

One branch, `feat/spa-port-repairs`. Each module gets `tasks/SPEC-<module-id>.md`, then
`plan-`/`todo-` files, all moved to `archive/` when the batch merges.
