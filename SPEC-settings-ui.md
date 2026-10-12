# Spec: settings-ui

Part of [SPEC.md](SPEC.md). Depends on `llm-settings` and `model-catalog`.

## Objective

Provider and model settings available in both the web and desktop apps, with one dialog on the same API. Choosing a provider picks a valid model for it.

## Current state

- `components/dashboard/SettingsDialog.svelte` renders only when `isTauri()` (`App.svelte:21,32,147`), and saves through Tauri commands (`lib/native/index.ts:154-218`).
- Web has no settings UI.

## Requirements

1. `SettingsDialog` works in both apps: provider select and model select (reusing `ModelPicker` from `node-model-picker`), loaded from `GET /api/settings` and `GET /api/models`, saved with `PUT /api/settings`. Selecting a provider fills in its default model.
2. Shows where the current value came from (`source`) and any validation error from the API.
3. Web app: no key fields; a note says keys come from the environment or `.env`.
4. Desktop only: the existing key, base-URL and Claude CLI fields stay, saved through the Tauri commands; the "restart to apply" prompt is removed (hot-apply).
5. A settings icon button sits at the top right of the global navigation bar, on every page, in both apps (no longer gated on `isTauri()`). It opens the dialog and has an accessible label ("Settings").

## Commands

```
cd frontend && npx vitest run tests/components/dashboard/SettingsDialog.test.ts && npx playwright test
make desktop-dev   # manual desktop check
```

## Structure

- `frontend/src/components/dashboard/SettingsDialog.svelte`, `frontend/src/App.svelte`, `frontend/src/lib/native/index.ts`, `frontend/src/lib/api` (settings client).
- Tests: `SettingsDialog.test.ts` (extend), `frontend/e2e/settings.spec.ts` (new).

## Testing

- Vitest against the real server: load, change provider, default model fills, save, reload shows the new value; invalid pair surfaces the 422 message.
- Playwright: open settings in the web app, change provider/model, submit a gate-only run, confirm it recorded the new pair. No LLM nodes.
- Desktop: manual QA per backlog #19 (no desktop e2e).

## Success criteria

- Settings reachable and working in the web app with no Tauri.
- Desktop changes apply to the next run without restart.

## Open Questions

None outstanding.
