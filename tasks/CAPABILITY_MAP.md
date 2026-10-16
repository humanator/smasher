# Capability Map: Smasher frontend redesign

Status: **Approved 2026-10-14.** Module specs (`SPEC-<module-id>.md`) sit beside this map in
`tasks/`, are written in build order, and are each approved before planning; done ones move to `archive/`.

Design source: Claude Design canvas "Smasher Workflow Editor Redesign"
(https://claude.ai/artifact/YQ7Hstw2od9Bx5wCi2JdtZ). Artboards: `Home` (Dashboard),
`Workflow` (Workflow detail), `Run`, `Main` (Workflow editor), `Components` + 14 component boards.
Offline copies are in [docs/design/redesign/](../docs/design/redesign/README.md).

## Objective

Restyle and restructure the Svelte SPA in `frontend/` to match the redesign. The SPA runs in a
browser and in the `smasher-desktop` Tauri window. The redesign gives it a macOS look
(source-list sidebar, unified toolbar, system font, magenta accent) and rewrites the copy so
someone who has never read a DOT file can run a workflow and answer a paused run.

Users: people who run and lightly edit Smasher workflows, mostly in the desktop app, and the
engineers who maintain them.

Decisions already made (2026-10-14):

1. Work happens on `claude/agent-skills-frontend-design-f96332`, reset onto `main`.
2. Where the screen artboards and the `Components` board disagree, the **screens win**: system
   font stack, `#BE185D` accent, grey source-list sidebar. The shadcn-svelte tokens in
   `frontend/src/app.css` are retuned to match. The Manrope/Figtree fonts are dropped.
3. Every screen is in scope: shell, dashboard, workflow detail, run, editor.
4. Changes can reach `smasher-web` only through **additive, read-only** API fields or endpoints.
   Anything else needs approval first.

## Capability map

| Module id | Responsibility | Depends on |
|---|---|---|
| `shell-theme` | Retuned tokens (light + dark), system font stack, plain-language step vocabulary + kind colours/icons, `AppShell`: 220px source-list sidebar (Library: Workflows / Recent runs / Needs you with count; Workflows list with status dots; footer), 52px unified toolbar replacing `PageHeader`, Tauri overlay title bar | — |
| `dashboard` | Home: "needs your decision" banner, All workflows table with search + empty state, Recent runs with filter toggle group + empty state, Run dialog (optional fields, advanced per-step models), Settings dialog (model, provider, keys, claude CLI) | `shell-theme` |
| `workflow-detail` | Workflow page: toolbar actions (Back, Show in Finder, Edit, Run), active-run banner, "What it does" step list, run history with inline error summaries | `shell-theme` |
| `run` | Run page: progress, activity log, decision panel (candidates, note, choice), plain-language failure panel with "What you can try", run details | `shell-theme` |
| `editor` | Workflow editor: palette with search + step guide, canvas chrome, plain-language settings inspector for steps and connections | `shell-theme` |

Build order: `shell-theme` → `dashboard`, `workflow-detail`, `run`, `editor`. The last four
are independent and can run in parallel or in any order.

Any API additions, such as a needs-you count, per-run error summary, workflow last activity or
reveal-in-Finder, belong to the module that first needs them. That module's spec defines the
contract.

## Tech Stack

The stack doesn't change. Svelte 5 (runes), TypeScript strict, Vite, Tailwind CSS v4,
shadcn-svelte on Bits UI, `@lucide/svelte`, `@xyflow/svelte`, Vitest + Testing Library,
Playwright. Backend: axum `smasher-web` (port 21541) and Tauri 2 `smasher-desktop`.

## Commands

```bash
cd frontend && npm run dev                 # Vite dev server, proxies /api to 127.0.0.1:21541
cd frontend && npm run dev:backend         # smasher-web with SMASHER_WORKFLOWS_DIR=examples
cd frontend && npm run test -- --run       # Vitest unit/component tests
cd frontend && npm run test:e2e            # Playwright (LLM-spending specs skip unless SMASHER_LLM_TESTS=1)
cd frontend && npm run check               # svelte-check
cd frontend && npm run lint                # eslint --fix
cd frontend && npm run build:check         # build + bundle-size guard
cargo test -p smasher-web                  # only when a module adds API fields
cargo clippy -p smasher-web -- -D warnings
make desktop-dev                           # visual check inside the Tauri window
```

## Project Structure

```
frontend/src/app.css                      → theme tokens (shell-theme owns)
frontend/src/lib/components/ui/           → shadcn-svelte primitives; restyle via tokens, not forks
frontend/src/lib/stepKinds.ts             → NEW: handler → label/icon/colour vocabulary (shell-theme)
frontend/src/components/shell/            → NEW: AppShell, SourceList, Toolbar (shell-theme)
frontend/src/components/dashboard/        → dashboard, workflow-detail, run pages
frontend/src/components/node-editor/      → editor
frontend/tests/                           → Vitest, mirrors src/
frontend/e2e/                             → Playwright, one spec per screen
crates/smasher-web/src/routes/            → additive API only
```

## Code Style

Follow the existing SPA conventions. Every file starts with two `ABOUTME:` lines. Use runes
only. Build from `$lib/components/ui` primitives and theme tokens, never raw hex in components.

```svelte
<script lang="ts">
  // ABOUTME: Step list for a workflow - numbered rows with kind chip, label and plain-language kind
  // ABOUTME: Kind label, icon and colours come from stepKinds so every screen names steps the same way
  import { stepKind } from '$lib/stepKinds';
  let { steps }: { steps: { id: string; label: string; handler: string }[] } = $props();
</script>

<ol class="overflow-hidden rounded-lg border bg-muted">
  {#each steps as step, i (step.id)}
    {@const kind = stepKind(step.handler)}
    <li class="flex items-center gap-2.5 border-b px-3 py-2 last:border-b-0">
      <span class="w-4 text-right text-xs tabular-nums text-muted-foreground">{i + 1}</span>
      <span class="grid size-6.5 place-items-center rounded-md {kind.chipClass}"><kind.icon class="size-3.5" /></span>
      <span><span class="block text-sm font-medium">{step.label}</span><span class="block text-xs text-muted-foreground">{kind.label}</span></span>
    </li>
  {/each}
</ol>
```

UI copy follows the design: en-AU spelling, sentence case for headings and Title Case for
buttons as drawn, plain-language step names (Codergen → "AI Agent", Conditional → "Branch",
Interviewer/WaitHuman → "Ask a person", Exit → "Finish"). Raw handler names appear only in
technical details such as the editor's DOT view.

## Testing Strategy

- **Unit (Vitest):** pure helpers such as `stepKinds`, status → badge mapping, error summarising
  and filter logic.
- **Component (Vitest + Testing Library):** each new or restyled component renders its states:
  empty, loading, error, needs-you and populated. Tests query by role and label so they also
  check accessibility.
- **Integration (Vitest against real `smasher-web`):** every new API field or endpoint, plus a
  Rust test in `smasher-web` for each addition.
- **E2E (Playwright against real `smasher-web`):** one spec per screen for navigation and the
  primary flow. These specs use workflows that make no LLM calls. Update existing specs whose
  selectors change. Don't delete them.
- **Never** run LLM-spending tests (`critical-path`, Vitest tests that launch LLM runs) unless
  Jobsworth asks for them explicitly.
- Output must be clean: zero warnings from `check`, `lint`, Vitest and clippy.

## Boundaries

- **Always:** TDD (write a failing test, then the code); keep `ABOUTME:` headers; theme tokens
  instead of hex; real `<button>`/`<a>`/`<label>` elements, 4.5:1 contrast and visible focus
  rings (design: `0 0 0 3px rgba(190,24,93,.4)`); make every screen work at phone width in the
  browser; commit after each green task.
- **Ask first:** non-additive API changes; new npm or cargo dependencies; replacing a
  shadcn-svelte primitive instead of restyling it; changes to `smasher-desktop` beyond
  title-bar config; dropping a capability the current UI has that the design doesn't show.
- **Never:** draw fake window traffic lights (the Tauri overlay title bar shows the real ones,
  and the browser shows none); invent data the API doesn't provide (no hard-coded counts or
  durations); remove or skip failing tests without approval; run LLM-spending tests unasked;
  push or open a PR unasked.

## Success Criteria (initiative level)

Each module spec refines these into testable conditions.

1. Every in-scope screen matches its artboard in layout, hierarchy, copy and tokens at
   1440×900, checked side by side in the browser and in `make desktop-dev`.
2. Every current capability is still reachable: create/import/edit/run workflows, live events,
   answer gates, gallery decisions, settings, cancel/resume.
3. `npm run check`, `npm run lint`, `npm run test -- --run`, non-LLM `npm run test:e2e`,
   `cargo test -p smasher-web` and clippy all pass with zero warnings.
4. Light and dark themes both meet WCAG AA contrast.

## Resolved Questions

1. **Dark mode:** derive a dark palette from the same tokens (macOS dark source list, same
   accent hue). It follows the OS setting.
2. **Design references:** copied to `docs/design/redesign/`.
3. **Components board:** update the canvas to match once `shell-theme` lands. This is a
   follow-up and is not in any module's scope.
